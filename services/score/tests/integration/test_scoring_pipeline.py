"""Events in → snapshots, feature vectors, cache and read APIs out; any snapshot replays to the same KRS."""

import json
from datetime import timedelta

import pytest
from sqlalchemy import func, select

from app.config.loader import load_config
from app.db.models import FeatureVector, ScoreSnapshot
from app.events.consumer import consume_once, ensure_group
from app.events.relay import publish_pending
from app.scoring import snapshots
from app.scoring.nightly import rescore_all
from tests.conftest import signed_get, signed_post
from tests.golden import personas as P

pytestmark = pytest.mark.integration

CFG = load_config()
AS_OF = P.START + timedelta(days=200)


def run(client, sm, redis, settings, persona, as_of=AS_OF) -> None:
    r = signed_post(client, "/v1/events", json.dumps({"events": persona.wire}).encode())
    assert r.status_code == 202, r.text
    ensure_group(redis, settings)
    with sm() as s:
        publish_pending(s, redis, settings)
    while consume_once(redis, sm, settings, CFG, "t1", block_ms=50, clock=lambda: as_of):
        pass


def test_each_event_writes_a_snapshot_and_feature_vector(client, sm, redis, settings):
    p = P.rohan()
    run(client, sm, redis, settings, p)
    with sm() as s:
        assert s.scalar(select(func.count()).select_from(ScoreSnapshot)) == len(p.wire)
        assert s.scalar(select(func.count()).select_from(FeatureVector)) == len(p.wire)
        snap = snapshots.latest(s, p.user_id)
    assert snap.band == "A"
    assert snap.points["base"] == 500
    assert snap.krs == snap.points["raw_krs"] + snap.points["velocity_cap"]
    assert snap.config_hash == CFG.hash and snap.scorecard_version == "v1.0.0"


def test_any_snapshot_replays_to_the_same_krs(client, sm, redis, settings):
    run(client, sm, redis, settings, P.meera())
    with sm() as s:
        for snap in s.scalars(select(ScoreSnapshot)):
            again = snapshots.replay(s, snap, CFG)
            assert (again.krs, again.aura, again.band, again.reason_codes, again.knockouts) == (
                snap.krs, snap.aura, snap.band, snap.reason_codes, snap.knockouts)
            assert again.features == {k: v for k, v in snap.features.items() if k != "evaluated_at"}


def test_get_score_serves_the_cached_latest(client, sm, redis, settings):
    p = P.aanya()
    run(client, sm, redis, settings, p)
    r = signed_get(client, f"/v1/users/{p.user_id}/score")
    assert r.status_code == 200, r.text
    body = r.json()
    assert (body["krs"], body["aura"], body["band"], body["tier"], body["fresh_spawn"]) == (520, 30, "C",
                                                                                           "side_quest", True)
    assert body["versions"]["config_hash"] == CFG.hash
    assert {**snapshots.cached(redis, p.user_id), "ladder_levels": body["ladder_levels"]} == body
    assert [x["level"] for x in body["ladder_levels"]] == ["L1", "L2", "L3", "L4", "L5", "L6"]


def test_explain_shows_points_features_and_knockout_text(client, sm, redis, settings):
    p = P.kabir()
    run(client, sm, redis, settings, p, as_of=P.START + timedelta(days=60))
    body = signed_get(client, f"/v1/users/{p.user_id}/score/explain").json()
    assert body["points"]["factors"]["f3_current_overdue"]["points"] == -220
    assert body["features"]["f3_current_dpd"] >= 31
    ko = next(k for k in body["knockouts"] if k["code"] == "KO_OVERDUE_30")
    assert ko["way_out"] == "Clear the overdue amount."


def test_score_reads_need_a_signature_and_an_existing_user(client):
    assert client.get(f"/v1/users/{P.aanya().user_id}/score").status_code == 401
    assert signed_get(client, f"/v1/users/{P.aanya().user_id}/score").status_code == 404


def test_cache_never_goes_back_in_time(client, sm, redis, settings):
    p = P.aanya()
    run(client, sm, redis, settings, p)
    with sm() as s:
        newest = snapshots.latest(s, p.user_id)
        older = s.scalars(select(ScoreSnapshot).order_by(ScoreSnapshot.as_of)).first()
    older.as_of = newest.as_of - timedelta(days=1)
    assert snapshots.cache_latest(redis, older) is False
    assert snapshots.cached(redis, p.user_id)["snapshot_id"] == str(newest.id)


def test_nightly_rescore_ages_an_overdue_loan(client, sm, redis, settings):
    p = P.kabir()
    due_plus_5 = P.START + timedelta(days=2 + 20 + 5)
    run(client, sm, redis, settings, p, as_of=due_plus_5)
    with sm() as s:
        before = snapshots.latest(s, p.user_id)
    assert rescore_all(sm, redis, CFG, due_plus_5 + timedelta(days=30)) == 1
    with sm() as s:
        after = snapshots.latest(s, p.user_id)
    assert after.trigger_event_id is None
    assert after.krs < before.krs
    assert "KO_OVERDUE_30" in after.knockouts and "KO_OVERDUE_30" not in before.knockouts
