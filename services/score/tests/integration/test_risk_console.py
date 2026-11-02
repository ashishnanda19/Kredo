"""The ops risk console endpoints: risk list, user detail, ops what-if, monitoring and audit trails."""

from datetime import UTC, datetime, timedelta

import pytest

from tests.conftest import ops_token, signed_get
from tests.golden import personas as P
from tests.integration.helpers import ingest_and_drain, post

pytestmark = pytest.mark.integration

ANALYST = ops_token("risk_analyst", "analyst")


def get(client, path, token=ANALYST):
    return signed_get(client, path, key="bff", token=token)


@pytest.fixture
def population(client, sm, redis, settings):
    people = {"rohan": P.rohan(), "kabir": P.kabir(), "pair": P.collusion_pair(), "aanya": P.aanya()}
    # Rohan's history arrives in two parts, scored at different times, so his snapshots differ
    rohan = people["rohan"]
    half = len(rohan.wire) // 2
    ingest_and_drain(client, sm, redis, settings, P.Persona(rohan.name, rohan.wire[:half]),
                     as_of=P.START + timedelta(days=70))
    ingest_and_drain(client, sm, redis, settings, P.Persona(rohan.name, rohan.wire[half:]))
    for key in ("kabir", "pair", "aanya"):
        ingest_and_drain(client, sm, redis, settings, people[key])
    return people


def test_risk_list_sorts_riskiest_first_and_filters(client, population):
    body = get(client, "/v1/ops/users").json()
    assert body["total"] == 4
    assert "KO_OVERDUE_30" in body["rows"][0]["knockouts"]  # the unpaid loans come first
    assert [r["krs"] for r in body["rows"]] == sorted(r["krs"] for r in body["rows"])
    pair = next(r for r in body["rows"] if r["user_id"] == str(population["pair"].user_id))
    assert pair["open_alerts"] == 1 and pair["synthetic"] is True

    ko = get(client, "/v1/ops/users?knockout=KO_OVERDUE_30").json()
    assert {r["user_id"] for r in ko["rows"]} == {str(population["kabir"].user_id), str(population["pair"].user_id)}
    assert get(client, "/v1/ops/users?band=A").json()["rows"][0]["user_id"] == str(population["rohan"].user_id)
    part = str(population["aanya"].user_id)[-8:]
    found = get(client, f"/v1/ops/users?q={part}").json()["rows"]
    assert [r["user_id"] for r in found] == [str(population["aanya"].user_id)]
    paged = get(client, "/v1/ops/users?limit=2&offset=2").json()
    assert (paged["total"], len(paged["rows"])) == (4, 2)


def test_risk_views_are_for_risk_and_fraud_roles(client, population):
    assert get(client, "/v1/ops/users", ops_token("fraud")).status_code == 200
    assert get(client, "/v1/ops/users", ops_token("support")).status_code == 403
    assert get(client, f"/v1/ops/users/{population['rohan'].user_id}", ops_token("reviewer")).status_code == 403
    assert get(client, "/v1/ops/monitoring", ops_token("support")).status_code == 200  # aggregates only


def test_user_detail_has_points_history_events_and_ladder(client, population):
    rohan = population["rohan"]
    body = get(client, f"/v1/ops/users/{rohan.user_id}").json()
    latest = body["latest"]
    pts = latest["points"]
    assert pts["base"] + sum(f["points"] for f in pts["factors"].values()) == pts["raw_krs"]
    assert pts["raw_krs"] + pts["velocity_cap"] == latest["krs"]
    assert len(body["events"]) == len(rohan.wire)
    assert body["snapshots"][0]["id"] == latest["id"] and body["snapshots"][-1]["diff"] == {}
    assert any("factors" in s["diff"] for s in body["snapshots"])
    assert body["ladder"]["level"] >= 1
    assert get(client, f"/v1/ops/users/{P.uid('nobody')}").status_code == 404

    kabir = get(client, f"/v1/ops/users/{population['kabir'].user_id}").json()
    assert kabir["knockouts"][0]["code"] == "KO_OVERDUE_30" and kabir["knockouts"][0]["way_out"]


def test_ops_simulate_shows_krs_and_saves_nothing(client, sm, redis, settings):
    now = datetime.now(UTC)
    p = P.Persona("ops-what-if").verify(at=now - timedelta(days=40))
    lid = p.loan(now - timedelta(days=3), paid_after_days=None)
    ingest_and_drain(client, sm, redis, settings, p)
    at = now + timedelta(days=5)
    repay = {"loan_id": lid, "amount_paise": P.AMOUNT, "paid_at": at.isoformat(), "rail": "upi"}
    body = {"events": [{"type": "repayment_received", "occurred_at": at.isoformat(), "payload": repay}]}
    r = post(client, f"/v1/ops/users/{p.user_id}/simulate", body, key="bff", token=ANALYST)
    assert r.status_code == 200, r.text
    assert {"krs", "band"} <= set(r.json()["projected"])
    assert post(client, f"/v1/ops/users/{p.user_id}/simulate", body, key="bff",
                token=ops_token("support")).status_code == 403


def test_monitoring_overview(client, population):
    post(client, "/v1/decisions/precheck", {"user_id": str(population["rohan"].user_id)})
    body = get(client, "/v1/ops/monitoring").json()
    assert body["users"] == 4 and sum(body["bands"].values()) == 4
    assert body["alerts"]["open"] == 1 and body["alerts"]["open_by_rule"] == {"COLLUSION": 1}
    assert body["approval"]["prechecks"] == 1 and body["approval"]["precheck_eligible_rate"] == 1.0
    assert body["dpd_roll"]["stages"][0]["from"] == "current"
    assert body["freshness_minutes"] is not None and body["v2_readiness"]["target_loans"] == 1500


def test_audit_trail_for_an_override(client, population):
    rohan = population["rohan"]
    created = post(client, "/v1/ops/overrides", {
        "user_id": str(rohan.user_id), "field": "pause_new_loans", "value": 1,
        "reason": "Partner asked for a pause while a dispute is open.",
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat()}, key="bff", token=ANALYST).json()
    post(client, f"/v1/ops/overrides/{created['id']}/approve", {}, key="bff", token=ops_token("risk_admin", "checker"))
    trail = get(client, f"/v1/ops/audit?target=override:{created['id']}").json()
    assert [a["action"] for a in trail] == ["override.create", "override.approve"]
    assert get(client, f"/v1/ops/audit?target=override:{created['id']}", ops_token("support")).status_code == 403
    assert get(client, "/v1/ops/audit?target=users:everything").status_code == 422


def test_config_view_includes_the_yaml_files(client):
    active = get(client, "/v1/ops/config").json()["active"]
    assert active["policy_yaml"].startswith("# Lending policy defaults") and "scorecard" in active
