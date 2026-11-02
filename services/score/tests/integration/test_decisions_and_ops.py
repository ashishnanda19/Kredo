"""Precheck and outcome, maker-checker overrides with audit, and the config view and dry-run, over HTTP."""

from datetime import UTC, datetime, timedelta

import pytest
import yaml
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError

from app.config.loader import DEFAULT_POLICY, build_config
from app.db.models import AuditLog, Decision, Event
from app.scoring import snapshots
from tests.conftest import ops_token, signed_get
from tests.golden import personas as P
from tests.integration.helpers import CFG, ingest_and_drain, post

pytestmark = pytest.mark.integration


# precheck and outcome ------------------------------------------------------------------------------------------------

def test_precheck_for_a_fresh_student(client, sm, redis, settings):
    p = P.aanya()
    ingest_and_drain(client, sm, redis, settings, p)
    r = post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id), "requested_amount_paise": 50_000})
    assert r.status_code == 200, r.text
    body = r.json()
    assert (body["eligible"], body["requested_ok"], body["level"], body["band"]) == (True, True, "L1", "C")
    assert body["recommended_limit_paise"] == body["max_ticket_paise"] == CFG.policy.ladder.levels[0].limit_paise
    assert body["note"] == "Recommendation only. The lending partner decides."
    with sm() as s:
        d = s.get(Decision, body["precheck_id"])
        assert (d.kind, d.eligible, d.requested_amount, d.caller) == ("precheck", True, 50_000, "demo")
    over = post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id), "requested_amount_paise": 150_000})
    assert over.json()["requested_ok"] is False


def test_precheck_explains_a_knockout(client, sm, redis, settings):
    p = P.kabir()
    ingest_and_drain(client, sm, redis, settings, p)
    body = post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id)}).json()
    assert body["eligible"] is False and body["max_ticket_paise"] == 0
    assert {"code": "KO_OVERDUE_30", "message": "A loan is more than 30 days overdue.",
            "way_out": "Clear the overdue amount."} in body["knockouts"]


def test_precheck_is_for_the_partner_only(client, sm, redis, settings):
    p = P.aanya()
    ingest_and_drain(client, sm, redis, settings, p)
    assert post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id)}, key="bff").status_code == 403
    unknown = post(client, "/v1/decisions/precheck", {"user_id": str(P.uid("nobody"))}, key="nbfc")
    assert unknown.status_code == 404


def test_outcome_is_stored_next_to_the_recommendation(client, sm, redis, settings):
    p = P.aanya()
    ingest_and_drain(client, sm, redis, settings, p)
    pre = post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id)}).json()
    loan = str(P.uid("aanya-first-loan"))
    same = post(client, f"/v1/decisions/{loan}/outcome", {
        "user_id": str(p.user_id), "decision": "approved", "approved_limit_paise": pre["recommended_limit_paise"],
        "precheck_id": pre["precheck_id"]}).json()
    assert same["agreement"] == "match"
    lower = post(client, f"/v1/decisions/{loan}/outcome", {
        "user_id": str(p.user_id), "decision": "approved", "approved_limit_paise": 50_000,
        "precheck_id": pre["precheck_id"]}).json()
    assert (lower["agreement"], lower["partner_limit_paise"]) == ("partner_lower", 50_000)
    assert post(client, f"/v1/decisions/{loan}/outcome", {"user_id": str(p.user_id), "decision": "declined"}
                ).json()["agreement"] == "no_precheck"
    with pytest.raises(DBAPIError, match="append-only"), sm.begin() as s:
        s.execute(text("UPDATE decisions SET eligible = NOT eligible"))


# overrides -----------------------------------------------------------------------------------------------------------

def _propose(client, user_id, token, **over):
    body = {"user_id": str(user_id), "field": "limit_cap_paise", "value": 50_000,
            "reason": "Partner asked to hold this student at ₹500 pending review.",
            "expires_at": (datetime.now(UTC) + timedelta(days=14)).isoformat(), **over}
    return post(client, "/v1/ops/overrides", body, key="bff", token=token)


def test_maker_checker_override_flows_into_the_score(client, sm, redis, settings):
    p = P.aanya()
    ingest_and_drain(client, sm, redis, settings, p)
    maker = ops_token("risk_analyst", "maker")
    created = _propose(client, p.user_id, maker)
    assert created.status_code == 201, created.text
    oid = created.json()["id"]

    # the maker cannot approve their own override, even when they also hold the admin role
    own = post(client, f"/v1/ops/overrides/{oid}/approve", {}, key="bff", token=ops_token("risk_admin", "maker"))
    assert (own.status_code, own.json()["detail"]["code"]) == (403, "MAKER_CANNOT_DECIDE")
    # an analyst cannot approve at all
    assert post(client, f"/v1/ops/overrides/{oid}/approve", {}, key="bff",
                token=ops_token("risk_analyst", "other")).status_code == 403

    ok = post(client, f"/v1/ops/overrides/{oid}/approve", {}, key="bff", token=ops_token("risk_admin", "checker"))
    assert ok.status_code == 200 and ok.json()["status"] == "approved"
    ingest_and_drain(client, sm, redis, settings, None)
    reco = signed_get(client, f"/v1/users/{p.user_id}/score").json()["limit_reco"]
    assert reco["amount_paise"] == 50_000 and reco["overrides"][0]["override_id"] == oid

    revoked = post(client, f"/v1/ops/overrides/{oid}/revoke", {}, key="bff", token=ops_token("risk_admin", "checker"))
    assert revoked.json()["status"] == "revoked"
    ingest_and_drain(client, sm, redis, settings, None)
    assert signed_get(client, f"/v1/users/{p.user_id}/score").json()["limit_reco"]["overrides"] == []

    with sm() as s:
        actions = [a.action for a in s.scalars(select(AuditLog).order_by(AuditLog.at, AuditLog.id))]
        internal = s.scalar(select(func.count()).select_from(Event).where(Event.source == "ops"))
    assert actions == ["override.create", "override.approve", "override.revoke"]
    assert internal == 2


def test_override_rules(client, sm, redis, settings):
    p = P.aanya()
    ingest_and_drain(client, sm, redis, settings, p)
    assert _propose(client, p.user_id, ops_token("support")).status_code == 403
    assert _propose(client, p.user_id, "not-a-token").status_code == 401
    assert _propose(client, p.user_id, ops_token("risk_analyst", secret="x" * 40)).status_code == 401
    assert _propose(client, P.uid("nobody"), ops_token("risk_analyst")).status_code == 404
    too_long = (datetime.now(UTC) + timedelta(days=settings.override_max_days + 1)).isoformat()
    assert _propose(client, p.user_id, ops_token("risk_analyst"), expires_at=too_long).status_code == 422
    assert _propose(client, p.user_id, ops_token("risk_analyst"), field="ladder_level", value=9).status_code == 422
    assert _propose(client, p.user_id, ops_token("risk_analyst"), reason="short").status_code == 422

    oid = _propose(client, p.user_id, ops_token("risk_analyst")).json()["id"]
    checker = ops_token("risk_admin", "checker")
    assert post(client, f"/v1/ops/overrides/{oid}/reject", {}, key="bff", token=checker).json()["status"] == "rejected"
    assert post(client, f"/v1/ops/overrides/{oid}/approve", {}, key="bff", token=checker).status_code == 409
    listed = signed_get(client, "/v1/ops/overrides?status=rejected", key="bff", token=checker).json()
    assert [o["id"] for o in listed] == [oid]


def test_override_events_cannot_be_posted_directly(client):
    p = P.aanya()
    p.add(P.EventType.OVERRIDE_APPROVED, P.START, {"override_id": str(P.uid("sneaky")), "field": "limit_cap_paise",
                                                   "value": 10_000_000, "expires_at": "2027-01-01T00:00:00+00:00"})
    r = post(client, "/v1/events", {"events": p.wire})
    assert (r.status_code, r.json()["detail"]["code"]) == (403, "INTERNAL_EVENT_TYPE")


# config view and dry-run ---------------------------------------------------------------------------------------------

def test_config_view_lists_the_active_config(client):
    body = signed_get(client, "/v1/ops/config", key="bff", token=ops_token("risk_analyst")).json()
    assert body["active"]["hash"] == CFG.hash
    assert body["active"]["policy"]["ladder"]["levels"][0]["level"] == "L1"
    assert [h["hash"] for h in body["history"]] == [CFG.hash]


def test_dry_run_counts_who_would_change_band(client, sm, redis, settings):
    p = P.rohan()
    ingest_and_drain(client, sm, redis, settings, p, as_of=datetime.now(UTC))
    pol = yaml.safe_load(DEFAULT_POLICY.read_text())
    pol["version"] = "stricter-a"
    pol["bands"][0]["min_krs"] = 990  # nobody stays in A
    r = post(client, "/v1/ops/config/dry-run", {"policy_yaml": yaml.safe_dump(pol)}, key="bff",
             token=ops_token("risk_admin"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["users_checked"] == 1 and body["band_changes"] == {"A→B": 1}
    assert body["candidate"]["policy_version"] == "stricter-a" and body["active_hash"] == CFG.hash
    assert body["sample"][0]["user"].count("…") == 1  # masked


def test_dry_run_refuses_an_unsafe_config(client):
    pol = yaml.safe_load(DEFAULT_POLICY.read_text())
    pol["ladder"]["levels"][1]["limit_paise"] = 50_000  # L2 below L1
    r = post(client, "/v1/ops/config/dry-run", {"policy_yaml": yaml.safe_dump(pol)}, key="bff",
             token=ops_token("risk_admin"))
    assert r.status_code == 422 and r.json()["detail"]["code"] == "INVALID_CONFIG"
    assert "rise level by level" in r.json()["detail"]["errors"][0]["error"]
    assert post(client, "/v1/ops/config/dry-run", {"policy_yaml": "a: [b"}, key="bff",
                token=ops_token("risk_admin")).status_code == 422
    assert post(client, "/v1/ops/config/dry-run", {}, key="bff", token=ops_token("support")).status_code == 403


def test_snapshots_replay_with_the_config_they_were_built_with(client, sm, redis, settings):
    p = P.meera()
    ingest_and_drain(client, sm, redis, settings, p, as_of=P.START + timedelta(days=200))
    pol = yaml.safe_load(DEFAULT_POLICY.read_text())
    pol["version"] = "later"
    later = build_config(CFG.scorecard.model_dump(by_alias=True), pol)
    with sm.begin() as s:
        snapshots.register_config(s, later)
    with sm() as s:
        snap = snapshots.latest(s, p.user_id)
        again = snapshots.replay(s, snap, later)  # wrong config handed in: replay finds the right one by hash
    assert (again.krs, again.config_hash, again.limit_reco) == (snap.krs, snap.config_hash, snap.limit_reco)
