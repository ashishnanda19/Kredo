"""The endpoints the Next.js BFF reads: score history, what-if simulation, and demo presets."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.db.models import Event
from app.main import create_app
from tests.conftest import signed_get
from tests.golden import personas as P
from tests.integration.helpers import ingest_and_drain, post

pytestmark = pytest.mark.integration


def _recent_student():
    """Two on-time loans and one open now, so the history has markers and the what-if has a loan to repay."""
    now = datetime.now(UTC)
    p = P.Persona("bff-student").verify(at=now - timedelta(days=80))
    for i in range(2):
        p.loan(now - timedelta(days=70 - 30 * i), paid_after_days=18)
    lid = p.loan(now - timedelta(days=3), paid_after_days=None)
    return p, lid


def test_history_returns_daily_aura_and_markers(client, sm, redis, settings):
    p, _ = _recent_student()
    ingest_and_drain(client, sm, redis, settings, p)
    r = signed_get(client, f"/v1/users/{p.user_id}/score/history")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["from"] < body["to"] and len(body["days"]) >= 80
    assert body["days"][-1]["aura"] == signed_get(client, f"/v1/users/{p.user_id}/score").json()["aura"]
    assert {m["kind"] for m in body["markers"]} >= {"repaid_early", "level_up"}

    short = signed_get(client, f"/v1/users/{p.user_id}/score/history?from={body['to']}&to={body['to']}").json()
    assert len(short["days"]) == 1
    assert signed_get(client, f"/v1/users/{p.user_id}/score/history?from=2026-10-10&to=2026-01-01"
                      ).status_code == 422
    assert signed_get(client, f"/v1/users/{P.uid('nobody')}/score/history").status_code == 404


def _what_if(user_id, lid, at, amount=P.AMOUNT, horizon=None):
    body = {"user_id": str(user_id), "events": [{"type": "repayment_received", "occurred_at": at.isoformat(),
                                                 "payload": {"loan_id": lid, "amount_paise": amount,
                                                             "paid_at": at.isoformat(), "rail": "upi"}}]}
    if horizon:
        body["horizon"] = horizon.isoformat()
    return body


def test_simulate_projects_without_saving(client, sm, redis, settings):
    p, lid = _recent_student()
    ingest_and_drain(client, sm, redis, settings, p)
    with sm() as s:
        before = s.scalar(select(func.count()).select_from(Event))
    at = datetime.now(UTC) + timedelta(days=10)
    r = post(client, "/v1/score/simulate", _what_if(p.user_id, lid, at, horizon=at + timedelta(days=12)), key="bff")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["current"]["aura"] == signed_get(client, f"/v1/users/{p.user_id}/score").json()["aura"]
    assert body["aura_change"] == body["projected"]["aura"] - body["current"]["aura"] >= 0
    with sm() as s:
        assert s.scalar(select(func.count()).select_from(Event)) == before


def test_simulate_only_accepts_the_students_own_open_loans_from_now_on(client, sm, redis, settings):
    p, lid = _recent_student()
    ingest_and_drain(client, sm, redis, settings, p)
    soon = datetime.now(UTC) + timedelta(days=2)
    codes = [
        post(client, "/v1/score/simulate", _what_if(p.user_id, str(P.uid("not-mine")), soon), key="bff"),
        post(client, "/v1/score/simulate", _what_if(p.user_id, lid, soon - timedelta(days=30)), key="bff"),
        post(client, "/v1/score/simulate", _what_if(p.user_id, lid, soon, amount="100"), key="bff"),
        post(client, "/v1/score/simulate", _what_if(p.user_id, lid, soon, horizon=soon + timedelta(days=400)),
             key="bff"),
    ]
    assert [(r.status_code, r.json()["detail"]["code"]) for r in codes] == [
        (422, "NOT_AN_OPEN_LOAN"), (422, "BAD_WHAT_IF_DATE"), (422, "BAD_WHAT_IF"), (422, "BAD_HORIZON")]
    other = {"user_id": str(p.user_id), "events": [{"type": "spend_made", "occurred_at": soon.isoformat(),
                                                    "payload": {}}]}
    assert post(client, "/v1/score/simulate", other, key="bff").status_code == 422  # only repay or close


def test_demo_presets_are_off_by_default(client):
    r = post(client, "/v1/demo/presets/fresh_spawn", {})
    assert (r.status_code, r.json()["detail"]["code"]) == (403, "PRESETS_DISABLED")


def test_demo_preset_creates_a_fake_student_the_worker_scores(sm, redis, settings):
    settings = settings.model_copy(update={"demo_presets": True})
    with TestClient(create_app(settings)) as c:
        assert post(c, "/v1/demo/presets/knockout_overdue_35", {}, key="bff").status_code == 403  # no demo source
        assert post(c, "/v1/demo/presets/not_a_preset", {}).status_code == 422
        r = post(c, "/v1/demo/presets/knockout_overdue_35", {})
        assert r.status_code == 201, r.text
        user = r.json()["user_id"]
        ingest_and_drain(c, sm, redis, settings, None)
        assert signed_get(c, f"/v1/users/{user}/score").json()["knockouts"] == ["KO_OVERDUE_30"]
        with sm() as s:
            assert s.scalar(select(func.bool_and(Event.synthetic))) is True
