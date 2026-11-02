import json
import time

import pytest
from sqlalchemy import func, select

from app.db.models import Event, Outbox
from app.domain.enums import EventType
from tests.conftest import signed_post
from tests.factories import event, uid

pytestmark = pytest.mark.integration


def applied(user: str = "aanya", loan: str = "l1", amount: int = 100_000, **kw) -> dict:
    return event(EventType.LOAN_APPLIED, user, {"loan_id": str(uid(loan)), "requested_amount_paise": amount}, **kw)


def body(*events) -> bytes:
    return json.dumps(events[0] if len(events) == 1 else {"events": list(events)}).encode()


def counts(sm) -> tuple[int, int]:
    with sm() as s:
        return s.scalar(select(func.count()).select_from(Event)), s.scalar(select(func.count()).select_from(Outbox))


def test_single_event_is_accepted_with_its_outbox_row(client, sm):
    e = applied()
    r = signed_post(client, "/v1/events", body(e))
    assert r.status_code == 202, r.text
    assert r.json() == {"accepted": [e["event_id"]], "duplicate": []}
    assert counts(sm) == (1, 1)


def test_retry_is_a_duplicate_and_writes_nothing(client, sm):
    e = applied()
    signed_post(client, "/v1/events", body(e))
    r = signed_post(client, "/v1/events", body(e))
    assert r.status_code == 202
    assert r.json() == {"accepted": [], "duplicate": [e["event_id"]]}
    assert counts(sm) == (1, 1)


def test_retry_with_a_new_event_id_still_dedupes_on_the_key(client, sm):
    e = applied()
    signed_post(client, "/v1/events", body(e))
    retry = {**e, "event_id": str(uid("fresh-id"))}
    r = signed_post(client, "/v1/events", body(retry))
    assert r.json() == {"accepted": [], "duplicate": [e["event_id"]]}
    assert counts(sm) == (1, 1)


def test_an_omitted_optional_field_and_an_explicit_null_are_the_same_body(client, sm):
    """A sender on an older contract (no `campus_id`) retrying after a deploy must get a duplicate, not a 409."""
    old = event(EventType.SPEND_MADE, "aanya", {"loan_id": str(uid("l1")), "vendor_id": str(uid("cafe")),
                                                "amount_paise": 5_000, "channel": "qr"})
    signed_post(client, "/v1/events", body(old))
    retry = {**old, "payload": {**old["payload"], "campus_id": None}}
    assert signed_post(client, "/v1/events", body(retry)).json() == {"accepted": [], "duplicate": [old["event_id"]]}


def test_same_key_with_a_different_body_is_a_conflict_and_writes_nothing(client, sm):
    e = applied()
    signed_post(client, "/v1/events", body(e))
    changed = {**e, "payload": {**e["payload"], "requested_amount_paise": 999_00}}
    other = applied(loan="l2")
    r = signed_post(client, "/v1/events", body(other, changed))
    assert r.status_code == 409
    assert r.json()["detail"] == {"code": "IDEMPOTENCY_CONFLICT", "idempotency_keys": [e["idempotency_key"]]}
    assert counts(sm) == (1, 1)  # `other` was rolled back with the batch


def test_conflict_inside_one_batch(client, sm):
    e = applied()
    changed = {**e, "payload": {**e["payload"], "requested_amount_paise": 999_00}}
    r = signed_post(client, "/v1/events", body(e, changed))
    assert r.status_code == 409
    assert counts(sm) == (0, 0)


def test_batch_reports_accepted_and_duplicates_in_order(client, sm):
    a, b = applied(loan="l1"), applied(loan="l2")
    signed_post(client, "/v1/events", body(a))
    r = signed_post(client, "/v1/events", body(a, b, b))
    assert r.json() == {"accepted": [b["event_id"]], "duplicate": [a["event_id"], b["event_id"]]}
    assert counts(sm) == (2, 2)


@pytest.mark.parametrize("tamper", ["signature", "key", "stale", "body"])
def test_bad_signatures_are_rejected(client, sm, tamper):
    raw = body(applied())
    if tamper == "stale":
        r = signed_post(client, "/v1/events", raw, ts=int(time.time()) - 3600)
    else:
        from app.util.signing import signed_headers
        from tests.conftest import KEYS

        headers = signed_headers("demo", KEYS["demo"].secret, int(time.time()), "POST", "/v1/events", raw)
        if tamper == "signature":
            headers["x-kredo-signature"] = "0" * 64
        elif tamper == "key":
            headers["x-kredo-key-id"] = "nobody"
        elif tamper == "body":
            raw = raw.replace(b"100000", b"900000")
        r = client.post("/v1/events", content=raw, headers=headers)
    assert r.status_code == 401
    assert counts(sm) == (0, 0)


def test_unsigned_request_is_rejected(client):
    r = client.post("/v1/events", content=body(applied()), headers={"content-type": "application/json"})
    assert r.status_code == 401


def test_a_key_cannot_send_another_sources_events(client, sm):
    r = signed_post(client, "/v1/events", body(applied(source="nbfc")), key="demo")
    assert r.status_code == 403
    r = signed_post(client, "/v1/events", body(applied()), key="nbfc")
    assert r.status_code == 403
    assert counts(sm) == (0, 0)


def test_mandate_events_are_refused_while_the_flag_is_off(client, sm):
    e = event(EventType.MANDATE_BOUNCE, "aanya", {"loan_id": str(uid("l1")), "amount_paise": 100_000,
                                                  "failure_class": "insufficient_funds"})
    r = signed_post(client, "/v1/events", body(e))
    assert r.status_code == 422
    assert r.json()["detail"] == {"code": "MANDATES_DISABLED"}
    assert counts(sm) == (0, 0)


def test_invalid_event_is_422(client):
    e = applied()
    e["payload"]["caste"] = "x"
    assert signed_post(client, "/v1/events", body(e)).status_code == 422


def test_health_and_ready(client):
    assert client.get("/v1/health").json() == {"status": "ok"}
    r = client.get("/v1/ready")
    assert r.status_code == 200
    assert r.json() == {"status": "ready", "checks": {"config": True, "database": True, "redis": True}}
