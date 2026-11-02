"""The simulated campus loaded into a real database, then everything built on it: replayable snapshots, labelled
outcomes without leakage, the monitoring numbers and report, the Parquet export and the sharded nightly re-score."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from redis import Redis
from sqlalchemy import func, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError

from app.db.models import Decision, Event, FraudAlert, Outbox, Outcome, ScoreSnapshot, User
from app.db.session import make_engine, make_sessionmaker
from app.main import create_app
from app.monitoring import report as weekly
from app.monitoring.export_training import export
from app.monitoring.outcomes import label_due_loans
from app.scoring import nightly, snapshots
from app.settings import Settings
from simulator.campus import generate
from simulator.load import load, write_cohorts
from tests.conftest import ADMIN_URL, KEYS, OPS_SECRET, REDIS_URL, TEMPLATE, ops_token, signed_get
from tests.integration.helpers import CFG
from tests.protected import mentions_protected

pytestmark = pytest.mark.integration

NOW = datetime(2026, 11, 2, 6, 0, tzinfo=UTC)
STUDENTS = 180  # enough fraud students for a complete identity ring of three
ANALYST = ops_token("risk_analyst", "analyst")

# Loading a campus takes a while, so these tests share one loaded database (module scope). They only read it,
# except the last test, which adds snapshots and so runs last.


@pytest.fixture(scope="module")
def world(admin_engine):
    name = f"kredo_score_sim_{uuid4().hex[:8]}"
    with admin_engine.connect() as c:
        c.execute(text(f"CREATE DATABASE {name} TEMPLATE {TEMPLATE}"))
    url = make_url(ADMIN_URL).set(database=name).render_as_string(hide_password=False)
    engine = make_engine(url)
    sm = make_sessionmaker(engine)
    redis = Redis.from_url(REDIS_URL, decode_responses=True)
    redis.flushdb()
    campus = generate(seed=11, students=STUDENTS, now=NOW)
    result = load(sm, redis, CFG, campus)
    settings = Settings(database_url=url, redis_url=REDIS_URL, hmac_keys=KEYS, stream="test:sim-events",
                        stream_dlq="test:sim-events:dlq", ops_jwt_secret=OPS_SECRET, demo_presets=False)
    with TestClient(create_app(settings)) as client:
        yield {"campus": campus, "result": result, "sm": sm, "redis": redis, "client": client}
    engine.dispose()
    redis.flushdb()
    redis.close()
    with admin_engine.connect() as c:
        c.execute(text(f"DROP DATABASE IF EXISTS {name} WITH (FORCE)"))


@pytest.fixture
def loaded(world):
    return world["campus"], world["result"]


@pytest.fixture
def sm(world):
    return world["sm"]


@pytest.fixture
def redis(world):
    return world["redis"]


@pytest.fixture
def client(world):
    return world["client"]


def test_the_campus_loads_once_and_leaves_nothing_for_the_worker_to_redo(sm, redis, loaded):
    campus, result = loaded
    assert result["already_loaded"] is False and result["ingested"] == len(campus.events)
    with sm() as s:
        assert s.scalar(select(func.count()).select_from(Event).where(Event.synthetic)) >= len(campus.events)
        assert s.scalar(select(func.count()).select_from(User)) == STUDENTS
        assert s.scalar(select(func.count()).select_from(Outbox).where(Outbox.published_at.is_(None))) == 0
        assert s.scalar(select(func.count()).select_from(ScoreSnapshot)) > 120
    assert load(sm, redis, CFG, campus) == {"already_loaded": True}  # a re-run is a no-op


def test_history_is_real_snapshots_are_dated_by_their_events_and_the_cache_is_warm(sm, redis, loaded):
    campus, _ = loaded
    uid = campus.students[0].user_id
    with sm() as s:
        snaps = list(s.scalars(select(ScoreSnapshot).where(ScoreSnapshot.user_id == uid)
                               .order_by(ScoreSnapshot.as_of)))
        assert len(snaps) >= 2 and snaps[0].as_of < snaps[-1].as_of <= NOW  # a history, not one snapshot at "now"
    assert snapshots.cached(redis, uid)["aura"] == snaps[-1].aura


def test_any_loaded_snapshot_replays_to_the_same_result(sm, loaded):
    with sm() as s:
        for snap in s.scalars(select(ScoreSnapshot).order_by(func.random()).limit(25)):
            again = snapshots.replay(s, snap)
            assert (again.krs, again.band, again.aura, again.limit_reco) == (snap.krs, snap.band, snap.aura,
                                                                            snap.limit_reco)


def test_fraud_alerts_and_partner_decisions_were_recorded(sm, loaded):
    with sm() as s:
        rules_seen = set(s.scalars(select(FraudAlert.rule)))
        assert {"FARMING", "COLLUSION", "RING"} <= rules_seen
        kinds = dict(s.execute(select(Decision.kind, func.count()).group_by(Decision.kind)).all())
        assert kinds["precheck"] == kinds["outcome"] > 50


def test_outcomes_are_labelled_with_decision_time_features_and_cannot_be_edited(sm, loaded):
    campus, result = loaded
    assert result["outcomes"] > 50
    with sm() as s:
        rows = list(s.scalars(select(Outcome)))
        assert all(o.label_version == 1 and o.decision_at < o.observed_at for o in rows)
        assert {o.bad_flag for o in rows} == {True, False}
        # features were known before the decision: the loan's own disbursal cannot be in them
        first_loans = [o for o in rows if o.features["closed_loans"] == 0 and o.features["f6_open_loans"] == 0]
        assert first_loans, "a student's first loan sees an empty record"
    with pytest.raises(DBAPIError, match="append-only"), sm.begin() as s:
        s.execute(text("UPDATE outcomes SET bad_flag = NOT bad_flag"))
    with sm.begin() as s:  # labelling again writes nothing new
        assert label_due_loans(s, CFG, NOW) == 0


def test_the_monitoring_endpoint_reports_model_health(client, loaded):
    body = signed_get(client, "/v1/ops/monitoring", key="bff", token=ANALYST).json()
    assert body["users"] == STUDENTS and sum(body["bands"].values()) == STUDENTS
    assert body["drift"]["points"] and "alert" in body["drift"]
    cal = {c["band"]: c for c in body["calibration"]}
    assert cal["C"]["loans"] > 0 and cal["C"]["observed_bad_rate"] is not None
    assert body["discrimination"]["loans"] == body["v2_readiness"]["labelled_loans"] > 50
    assert body["labels"] == {"version": 1, "window_days": 60, "bad_dpd": 30}
    assert body["alerts"]["open"] > 0 and body["approval"]["outcomes"] > 50


def test_the_weekly_report_has_every_section_and_the_fairness_check(sm, loaded, tmp_path):
    campus, _ = loaded
    cohorts_file = tmp_path / "cohorts.csv"
    write_cohorts(campus, cohorts_file)
    with sm() as s:
        report = weekly.build(s, CFG, NOW, weekly.read_cohorts(cohorts_file))
    md = weekly.render(report)
    for heading in ("## Population", "## Drift", "## Calibration", "## DPD roll rates", "## Approval",
                    "## Fraud alerts", "## v2 readiness", "## Fairness check"):
        assert heading in md, heading
    assert "not a credit bureau score" in md
    assert report["fairness"]["cohorts"] or report["fairness"]["hidden_small_cohorts"]  # small cells are hidden
    assert "user_id" not in md  # the report carries no identifiers


def test_the_training_export_round_trips_and_carries_the_label_definition(sm, loaded, tmp_path):
    import pyarrow.parquet as pq

    out = tmp_path / "training.parquet"
    with sm() as s:
        counts = export(s, CFG, out)
        assert counts["rows"] == s.scalar(select(func.count()).select_from(Outcome))
        assert counts["synthetic"] == counts["rows"]
        with pytest.raises(SystemExit, match="No labelled loans"):
            export(s, CFG, tmp_path / "none.parquet", synthetic=False)  # no real loans in this database
    table = pq.read_table(out)
    assert table.num_rows == counts["rows"] and set(table.column("bad").to_pylist()) == {0, 1}
    meta = {k.decode(): v.decode() for k, v in table.schema.metadata.items()}
    assert meta["label_version"] == "1" and '"window_days": 60' in meta["label_definition"]
    names = set(table.column_names)
    assert {"loan_id", "user_id", "decision_at", "krs_v1", "pd_v1", "band_v1", "feat_f1_ontime_rate"} <= names
    features = {n.removeprefix("feat_") for n in names if n.startswith("feat_")}
    assert not {n for n in features if mentions_protected(n)}  # status flags only, never which college
    assert not {n for n in names if any(w in n for w in ("name", "phone_number", "gender", "address"))}
    assert table.column("decision_at").to_pylist() == sorted(table.column("decision_at").to_pylist())


def test_the_sharded_nightly_rescore_covers_every_user_exactly_once(sm, redis, loaded):
    with sm() as s:
        before = s.scalar(select(func.count()).select_from(ScoreSnapshot))
    counts = [nightly.rescore_all(sm, redis, CFG, NOW, shard=(i, 3)) for i in range(3)]
    assert sum(counts) == STUDENTS and all(c > 0 for c in counts)
    with sm() as s:
        assert s.scalar(select(func.count()).select_from(ScoreSnapshot)) == before + STUDENTS
