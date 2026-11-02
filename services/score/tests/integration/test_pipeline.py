"""Ingest → outbox relay → Redis stream → consumer → read-model tables."""

import json
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.config.loader import load_config
from app.db.models import Consent, Loan, PaymentAttempt, Repayment, User, Vendor
from app.domain.enums import EventType, LoanState
from app.events import consumer as consumer_mod
from app.events.consumer import consume_once, ensure_group, reclaim_stale
from app.events.relay import publish_pending
from tests.conftest import signed_post
from tests.factories import T0, disbursed, event, repaid, uid

pytestmark = pytest.mark.integration

DUE = date(2026, 10, 20)
AS_OF = datetime(2026, 11, 1, 12, tzinfo=UTC)
CFG = load_config()


def clock() -> datetime:
    return AS_OF


def history() -> list[dict]:
    return [
        event(EventType.USER_VERIFIED, "rohan", {"kyc_level": "basic", "college_id_verified": True,
                                                 "college_email_verified": False}, T0 - timedelta(days=2)),
        event(EventType.USER_VERIFIED, "rohan", {"kyc_level": "full", "college_id_verified": True,
                                                 "college_email_verified": True,
                                                 "phone_first_seen_at": "2025-06-01"}, T0 - timedelta(days=1)),
        event(EventType.CONSENT_CHANGED, "rohan", {"purpose": "scoring", "granted": True, "text_version": "v1"},
              T0 - timedelta(days=1)),
        disbursed("rohan", "l1", 115_000, DUE),
        event(EventType.SPEND_MADE, "rohan", {"loan_id": str(uid("l1")), "vendor_id": str(uid("cafe")),
                                              "amount_paise": 115_000, "channel": "qr"}, T0 + timedelta(minutes=5)),
        event(EventType.PAYMENT_FAILED, "rohan", {"loan_id": str(uid("l1")), "amount_paise": 115_000,
                                                  "failure_class": "technical", "rail": "upi"},
              datetime(2026, 10, 17, 5, tzinfo=UTC)),
        repaid("rohan", "l1", 115_000, datetime(2026, 10, 17, 6, tzinfo=UTC)),
    ]


def ingest(client, events):
    r = signed_post(client, "/v1/events", json.dumps({"events": events}).encode())
    assert r.status_code == 202, r.text


def drain(sm, redis, settings) -> int:
    ensure_group(redis, settings)
    with sm() as s:
        published = publish_pending(s, redis, settings)
    handled = 0
    while n := consume_once(redis, sm, settings, CFG, "t1", block_ms=50, clock=clock):
        handled += n
    assert handled == published
    return handled


def snapshot(sm) -> dict:
    with sm() as s:
        loans = [(r.id, r.state, r.outstanding, r.max_dpd, r.paid_in_full_at) for r in s.scalars(select(Loan))]
        user = s.scalars(select(User)).one()
        return {
            "loans": loans,
            "user": (user.kyc_level, user.college_verified, user.phone_first_seen_at, user.created_at, user.synthetic),
            "repayments": [(r.id, r.amount) for r in s.scalars(select(Repayment))],
            "attempts": [(a.id, a.failure_class) for a in s.scalars(select(PaymentAttempt))],
            "vendors": [v.id for v in s.scalars(select(Vendor))],
            "consents": [(c.purpose, c.granted) for c in s.scalars(select(Consent))],
        }


def test_events_flow_through_to_the_read_model(client, sm, redis, settings):
    ingest(client, history())
    assert drain(sm, redis, settings) == 7
    snap = snapshot(sm)
    assert snap["loans"] == [(uid("l1"), LoanState.PAID_EARLY.value, 0, 0, datetime(2026, 10, 17, 6, tzinfo=UTC))]
    assert snap["user"] == ("full", True, date(2025, 6, 1), T0 - timedelta(days=2), True)
    assert len(snap["repayments"]) == 1
    assert snap["attempts"][0][1] == "technical"
    assert snap["vendors"] == [uid("cafe")]
    assert snap["consents"] == [("scoring", True)]
    assert redis.xpending(settings.stream, settings.stream_group)["pending"] == 0


def test_arrival_order_does_not_change_the_result(client, sm, redis, settings, db_url):
    ingest(client, history())
    drain(sm, redis, settings)
    expected = snapshot(sm)

    with sm.begin() as s:
        for table in ("payment_attempts", "repayments", "consents", "spends", "identity_links", "loans", "vendors",
                      "limit_ladder_state", "users", "outbox"):
            s.execute(text(f"DELETE FROM {table}"))  # read model only; the event log stays
    redis.flushdb()
    with sm.begin() as s:
        s.execute(text("INSERT INTO outbox (event_id) SELECT event_id FROM events ORDER BY random()"))
    drain(sm, redis, settings)
    assert snapshot(sm) == expected


def test_reprocessing_the_same_event_changes_nothing(client, sm, redis, settings):
    ingest(client, history())
    drain(sm, redis, settings)
    before = snapshot(sm)
    with sm.begin() as s:
        s.execute(text("UPDATE outbox SET published_at = NULL"))
    drain(sm, redis, settings)
    assert snapshot(sm) == before


def test_failing_events_are_retried_then_dead_lettered(client, sm, redis, settings, monkeypatch):
    ingest(client, history()[:1])
    ensure_group(redis, settings)
    with sm() as s:
        publish_pending(s, redis, settings)

    def boom(*_a, **_k):
        raise RuntimeError("projection bug")

    monkeypatch.setattr(consumer_mod, "project", boom)
    assert consume_once(redis, sm, settings, CFG, "t1", block_ms=50, clock=clock) == 0
    assert redis.xpending(settings.stream, settings.stream_group)["pending"] == 1
    assert reclaim_stale(redis, sm, settings, CFG, "t1", min_idle_ms=0, clock=clock) == 0  # 2nd delivery fails too
    reclaim_stale(redis, sm, settings, CFG, "t1", min_idle_ms=0, clock=clock)  # max_deliveries=2 → DLQ
    assert redis.xpending(settings.stream, settings.stream_group)["pending"] == 0
    dead = redis.xrange(settings.stream_dlq)
    assert len(dead) == 1 and dead[0][1]["event_id"] == history()[0]["event_id"]


SEED_ROWS = {
    "events": None,  # written through the API
    "score_snapshots": """INSERT INTO score_snapshots (id, user_id, as_of, krs, pd, band, aura, tier, fresh_spawn,
        streak, features, points, reason_codes, knockouts, limit_reco, input_event_ids, scorecard_version,
        policy_version, config_hash) VALUES (gen_random_uuid(), gen_random_uuid(), now(), 520, 0.03, 'C', 30,
        'side_quest', true, 0, '{}', '{}', '[]', '[]', '{}', '{}', 'v1', 'p1', 'h')""",
    "audit_log": "INSERT INTO audit_log (id, actor_id, action, target) VALUES (gen_random_uuid(), gen_random_uuid(), "
                 "'test', 'x')",
}


@pytest.mark.parametrize("table", ["events", "score_snapshots", "audit_log"])
@pytest.mark.parametrize("statement", ["UPDATE {t} SET {c} = {c}", "DELETE FROM {t}", "TRUNCATE {t} CASCADE"])
def test_append_only_tables_reject_changes(client, sm, table, statement):
    ingest(client, history()[:1])
    if SEED_ROWS[table]:
        with sm.begin() as s:
            s.execute(text(SEED_ROWS[table]))  # row triggers only fire when there is a row
    column = {"events": "type", "score_snapshots": "band", "audit_log": "action"}[table]
    with pytest.raises(DBAPIError, match="append-only"), sm.begin() as s:
        s.execute(text(statement.format(t=table, c=column)))
