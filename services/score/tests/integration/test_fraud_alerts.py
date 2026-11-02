"""Fraud alerts end to end: raised by the consumer, worked through the ops queue, and reflected in the score."""

import json
from datetime import timedelta
from uuid import UUID

import pytest
from sqlalchemy import func, select

from app.db.models import AuditLog, Event, FraudAlert
from app.db.repositories import EventRepository, to_record
from app.fraud import service as fraud
from tests.conftest import ops_token, signed_get, signed_patch
from tests.golden import personas as P
from tests.integration.helpers import CFG, ingest_and_drain, post

pytestmark = pytest.mark.integration

FRAUD = ops_token("fraud", "fraud-analyst")
T = P.START + timedelta(days=5)


def alerts(client, token=FRAUD, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    r = signed_get(client, f"/v1/ops/fraud-alerts?{query}" if query else "/v1/ops/fraud-alerts", key="bff",
                   token=token)
    assert r.status_code == 200, r.text
    return r.json()


def act(client, alert_id, action, token=FRAUD, reason="Checked the spend pattern against the vendor's records."):
    body = json.dumps({"action": action, "reason": reason}).encode()
    return signed_patch(client, f"/v1/ops/fraud-alerts/{alert_id}", body, token=token)


def score(client, user_id):
    return signed_get(client, f"/v1/users/{user_id}/score").json()


def test_collusion_pair_alert_confirm_and_maker_checker_lift(client, sm, redis, settings):
    p = P.collusion_pair()
    vendor = str(P.uid(P.COLLUSION_VENDOR))
    ingest_and_drain(client, sm, redis, settings, p)

    [a] = alerts(client, user_id=p.user_id)
    assert (a["rule"], a["severity"], a["status"], a["vendor_id"]) == ("COLLUSION", "high", "open", vendor)
    assert sorted(i["signal"] for i in a["evidence"]["instances"]) == ["refund_soon_after_spend",
                                                                        "same_amount_spends"]
    assert [x["id"] for x in alerts(client, vendor_id=vendor)] == [a["id"]]  # on the vendor too
    view = signed_get(client, f"/v1/ops/vendors/{vendor}/fraud-signals", key="bff", token=FRAUD).json()
    assert (view["students"], view["open"], view["by_rule"]) == (1, 1, {"COLLUSION": 1})
    assert "KO_FRAUD" not in score(client, p.user_id)["knockouts"]  # an open alert is not a knockout

    confirmed = act(client, a["id"], "confirm")
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["flag"] == "FRAUD_CONFIRMED"
    ingest_and_drain(client, sm, redis, settings, None)
    assert "KO_FRAUD" in score(client, p.user_id)["knockouts"]

    assert act(client, a["id"], "request_lift").json()["status"] == "lift_pending"
    own = act(client, a["id"], "approve_lift", token=ops_token("risk_admin", "fraud-analyst"))
    assert (own.status_code, own.json()["detail"]["code"]) == (403, "MAKER_CANNOT_DECIDE")
    assert act(client, a["id"], "approve_lift").status_code == 403  # the fraud role cannot check
    lifted = act(client, a["id"], "approve_lift", token=ops_token("risk_admin", "checker"))
    assert lifted.json()["status"] == "lifted"
    ingest_and_drain(client, sm, redis, settings, None)
    assert "KO_FRAUD" not in score(client, p.user_id)["knockouts"]

    with sm() as s:
        actions = [x.action for x in s.scalars(select(AuditLog).order_by(AuditLog.at, AuditLog.id))]
        flags = s.scalar(select(func.count()).select_from(Event).where(Event.source == "ops"))
    assert actions == ["alert.confirm", "alert.request_lift", "alert.approve_lift"]
    assert flags == 2  # FRAUD_CONFIRMED set, then cleared


def _speedy(name="speedy-student"):
    p = P.Persona(name).verify()
    lid = p.loan(T, amount=60_000, paid_after_days=10)
    for i in range(6):
        p.spend(lid, f"stall-{i}", 10_000, T + timedelta(minutes=1.5 * i))
    return p


def test_velocity_holds_new_loans_until_ops_review(client, sm, redis, settings):
    p = _speedy()
    ingest_and_drain(client, sm, redis, settings, p)
    [a] = alerts(client, rule="VELOCITY")
    assert a["hold"] is True and a["user_id"] == str(p.user_id)
    reco = score(client, p.user_id)["limit_reco"]
    assert (reco["held_for_review"], reco["eligible"], reco["action"]) == (True, False, "held_for_review")
    pre = post(client, "/v1/decisions/precheck", {"user_id": str(p.user_id)}).json()
    assert pre["eligible"] is False

    assert act(client, a["id"], "dismiss", reason="ok").status_code == 422  # a written reason is required
    dismissed = act(client, a["id"], "dismiss", reason="Freshers' fair: six stalls in one queue, receipts seen.")
    assert dismissed.json()["status"] == "dismissed"
    assert act(client, a["id"], "confirm").status_code == 409
    ingest_and_drain(client, sm, redis, settings, None)
    reco = score(client, p.user_id)["limit_reco"]
    assert (reco["held_for_review"], reco["eligible"]) == (False, True)


def test_shared_device_links_accounts_and_confirming_sets_duplicate(client, sm, redis, settings):
    first = P.Persona("ring-first").verify().identifier("device", "phone-in-a-drawer")
    second = P.Persona("ring-second").verify().identifier("device", "phone-in-a-drawer", at=T)
    other = P.Persona("ring-other").verify().identifier("device", "someone-elses-phone")
    for p in (first, second, other):
        ingest_and_drain(client, sm, redis, settings, p)

    rings = {x["user_id"]: x for x in alerts(client, rule="RING")}
    assert set(rings) == {str(first.user_id), str(second.user_id)}
    assert rings[str(first.user_id)]["evidence"]["instances"][0]["linked_accounts"] == [str(second.user_id)]
    assert len(rings[str(first.user_id)]["evidence"]["instances"][0]["digest_prefix"]) == 8

    assert act(client, rings[str(second.user_id)]["id"], "confirm").json()["flag"] == "DUPLICATE_IDENTITY"
    ingest_and_drain(client, sm, redis, settings, None)
    assert "KO_DUPLICATE" in score(client, second.user_id)["knockouts"]
    assert "KO_DUPLICATE" not in score(client, first.user_id)["knockouts"]


def test_alerts_merge_while_open_and_never_re_raise(client, sm, redis, settings):
    ingest_and_drain(client, sm, redis, settings, P.farhan(10))
    [farm] = alerts(client, rule="FARMING")
    assert (farm["severity"], farm["instances"], farm["hold"]) == ("low", 2, False)
    [chain] = alerts(client, rule="ROLLOVER", token=ops_token("support"))  # support sees rollovers to offer help
    assert chain["evidence"]["instances"][0]["loans_in_chain"] == 10

    with sm.begin() as s:  # reprocessing any event raises nothing new
        ev = to_record(EventRepository(s).get(UUID(P.farhan().wire[-1]["event_id"])))
        assert fraud.detect(s, ev, P.START + timedelta(days=60), CFG) == []

    assert act(client, farm["id"], "dismiss", reason="Exam week; repaid quickly from a scholarship payout.").json()[
        "status"] == "dismissed"
    ingest_and_drain(client, sm, redis, settings, P.farhan(15))  # five more quick loans
    farms = alerts(client, rule="FARMING")
    assert sorted((x["status"], x["instances"]) for x in farms) == [("dismissed", 2), ("open", 1)]
    assert len(alerts(client, rule="ROLLOVER")) == 1  # the same chain, already known


def test_vendor_volume_surge_is_a_vendor_alert(client, sm, redis, settings):
    a = P.Persona("surge-a").verify()
    lid = a.loan(P.START + timedelta(hours=1), amount=100_000, paid_after_days=None)
    a.spend(lid, "surge-kiosk", 100_000, P.START + timedelta(hours=2))
    b = P.Persona("surge-b").verify()
    lid = b.loan(P.START + timedelta(days=7, hours=1), amount=400_000, limit=1_000_000, paid_after_days=None)
    for i, amount in enumerate((100_000, 140_000, 160_000)):
        b.spend(lid, "surge-kiosk", amount, P.START + timedelta(days=7 + i, hours=2))
    ingest_and_drain(client, sm, redis, settings, a)
    ingest_and_drain(client, sm, redis, settings, b)

    [surge] = alerts(client, rule="VENDOR_ANOMALY")
    assert (surge["user_id"], surge["vendor_id"]) == (None, str(P.uid("surge-kiosk")))
    assert surge["evidence"]["instances"][0]["ratio"] == 4.0
    assert act(client, surge["id"], "confirm").json()["flag"] is None  # vendors are not scored


def test_alert_queue_permissions(client, sm, redis, settings):
    ingest_and_drain(client, sm, redis, settings, _speedy("perm-student"))
    [a] = alerts(client)
    assert act(client, a["id"], "confirm", token=ops_token("support")).status_code == 403
    assert act(client, a["id"], "confirm", token=ops_token("reviewer")).status_code == 403
    assert act(client, a["id"], "request_lift").status_code == 409  # nothing confirmed yet
    assert signed_get(client, f"/v1/ops/fraud-alerts/{P.uid('nope')}", key="bff", token=FRAUD).status_code == 404
    assert signed_get(client, "/v1/ops/fraud-alerts", key="bff", token="not-a-token").status_code == 401
    with sm() as s:
        assert s.scalar(select(func.count()).select_from(FraudAlert)) == 1


def test_public_events_cannot_touch_alert_flags(client):
    p = P.aanya()
    p.add(P.EventType.FRAUD_FLAG_CLEARED, P.START, {"flag_type": "SPEND_HOLD", "reason": "sneaky",
                                                    "actor_id": str(P.uid("x")), "ref": str(P.uid("some-alert"))})
    r = post(client, "/v1/events", {"events": p.wire})
    assert (r.status_code, r.json()["detail"]["code"]) == (403, "INTERNAL_REF")
