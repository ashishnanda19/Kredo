"""Loads the simulated campus into the database as if it had really happened over the last six months:
`python -m simulator.load` (`make seed`).

It is a backfill, not a shortcut: events are replayed in time order through the same steps the worker runs for every
event (project, fraud rules, rescore, snapshot), each as of the event's own time, so the history, the alerts, the
snapshots and the audit trail are what production would have produced. On top of that it records a monthly re-score
(what the nightly job does), the partner's prechecks and decisions, the labelled outcomes and the cached latest
scores. Outbox rows for the loaded events are marked published, so a running worker does not process them again.

Re-running is safe: if the campus is already loaded it says so and stops (`make reset` for a fresh start).
"""

import argparse
import csv
import logging
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID

from redis import Redis
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, sessionmaker

from app.config.loader import EngineConfig, load_config
from app.db.models import Decision, Event, Outbox
from app.db.session import make_engine, make_sessionmaker
from app.domain.enums import EventType
from app.domain.records import EventRecord
from app.events.ingest import ingest
from app.events.projector import project
from app.events.schemas import EventBatch
from app.fraud import service as fraud
from app.logs import configure_logging
from app.monitoring.outcomes import label_due_loans
from app.scoring import snapshots
from app.settings import get_settings
from app.util.ids import uuid7
from simulator.campus import Campus, generate

log = logging.getLogger(__name__)

# Events after which a student's score can change. Spends, identifier sightings and applications cannot, so
# they are projected and checked for fraud but do not get a snapshot of their own (the monthly re-score covers them).
SNAPSHOT_ON = frozenset({"user_verified", "consent_changed", "loan_disbursed", "repayment_received", "loan_closed",
                         "payment_failed", "promise_to_pay_broken", "limit_increase_requested", "refund_issued",
                         "fraud_flag_set", "fraud_flag_cleared"})
SWEEP_EVERY_DAYS = 30
BATCH = 500


def record(w: dict[str, Any]) -> EventRecord:
    return EventRecord(UUID(w["event_id"]), EventType(w["type"]), UUID(w["user_id"]),
                       datetime.fromisoformat(w["occurred_at"]), w["payload"], w["synthetic"])


def already_loaded(sm: sessionmaker, campus: Campus) -> bool:
    with sm() as s:
        key = campus.events[0]["idempotency_key"]
        return bool(s.scalar(select(func.count()).select_from(Event).where(Event.idempotency_key == key)))


def ingest_all(sm: sessionmaker, campus: Campus) -> int:
    n = 0
    for i in range(0, len(campus.events), BATCH):
        events = list(EventBatch.model_validate({"events": campus.events[i:i + BATCH]}).events)
        with sm.begin() as s:
            ingest(s, events, mandates_enabled=False, commit=False)
            s.execute(update(Outbox).where(Outbox.published_at.is_(None),
                                           Outbox.event_id.in_([e.event_id for e in events]))
                      .values(published_at=func.now()))
        n += len(events)
    return n


def sweep(s: Session, users: list[UUID], at: datetime, cfg: EngineConfig, latest: dict[UUID, Any]) -> int:
    """The nightly re-score, as of `at`, for every user seen so far."""
    for user_id in users:
        result = snapshots.compute_for_user(s, user_id, at, cfg)
        if result is not None:
            latest[user_id] = snapshots.save(s, result, cfg, trigger_event_id=None)
    return len(users)


def record_decision(s: Session, rec: EventRecord) -> None:
    """The partner's side of a `loan_decided` event: our precheck (from the student's latest snapshot) and what the
    partner actually did, so approval and agreement can be monitored. The simulated partner mostly follows our
    recommended limit, and sometimes lends a level lower."""
    snap = snapshots.latest(s, rec.user_id)
    if snap is None:
        return
    reco = snap.limit_reco or {}
    loan = UUID(rec.payload["loan_id"])
    precheck = Decision(id=uuid7(), kind="precheck", user_id=rec.user_id, loan_id=loan, snapshot_id=snap.id,
                        caller="simulator", eligible=reco.get("eligible"), band=snap.band,
                        recommended_limit=reco.get("amount_paise"), max_ticket=reco.get("max_ticket_paise"),
                        knockouts=snap.knockouts, reason_codes=snap.reason_codes, created_at=rec.occurred_at)
    s.add(precheck)
    s.flush()
    approved = rec.payload["decision"] == "approved"
    limit = reco.get("amount_paise") or 0
    if approved and limit > 100_000 and loan.int % 10 == 0:
        limit -= 100_000
    s.add(Decision(id=uuid7(), kind="outcome", user_id=rec.user_id, loan_id=loan, precheck_id=precheck.id,
                   snapshot_id=snap.id, caller="simulator", recommended_limit=precheck.recommended_limit,
                   partner_decision=rec.payload["decision"], partner_limit=limit if approved else None,
                   reason_codes=[{"code": c} for c in rec.payload.get("reason_codes", [])],
                   created_at=rec.occurred_at))


def replay(sm: sessionmaker, redis: Redis | None, cfg: EngineConfig, campus: Campus,
           progress: bool = False) -> dict[str, int]:
    start = campus.start
    sweeps = [start + timedelta(days=SWEEP_EVERY_DAYS * k) for k in range(1, 40)
              if start + timedelta(days=SWEEP_EVERY_DAYS * k) < campus.now]
    stats = {"events": 0, "snapshots": 0, "alerts": 0, "sweeps": 0, "decisions": 0}
    seen: list[UUID] = []
    seen_set: set[UUID] = set()
    latest: dict[UUID, Any] = {}
    t0 = time.time()
    with sm() as s:
        for w in campus.events:
            rec = record(w)
            while sweeps and rec.occurred_at >= sweeps[0]:
                sweep(s, seen, sweeps.pop(0), cfg, latest)
                stats["sweeps"] += 1
                s.commit()
            if rec.user_id not in seen_set:
                seen_set.add(rec.user_id)
                seen.append(rec.user_id)
            project(s, rec, rec.occurred_at)
            opened = fraud.detect(s, rec, rec.occurred_at, cfg)
            stats["alerts"] += len(opened)
            if rec.type == EventType.LOAN_DECIDED:
                record_decision(s, rec)
                stats["decisions"] += 1
            if rec.type.value in SNAPSHOT_ON or opened:
                result = snapshots.compute_for_user(s, rec.user_id, rec.occurred_at, cfg)
                if result is not None:
                    latest[rec.user_id] = snapshots.save(s, result, cfg, trigger_event_id=rec.event_id)
                    stats["snapshots"] += 1
            stats["events"] += 1
            if stats["events"] % 200 == 0:
                s.commit()
                if progress and stats["events"] % 1000 == 0:
                    print(f"  replayed {stats['events']} of {len(campus.events)} events ({time.time() - t0:.0f}s)")
        sweep(s, seen, campus.now, cfg, latest)  # the last re-score, as of now
        stats["sweeps"] += 1
        # hold flags written by the fraud step went through ingest too: they are already scored here
        s.execute(update(Outbox).where(Outbox.published_at.is_(None), Outbox.event_id.in_(
            select(Event.event_id).where(Event.source == "ops", Event.synthetic))).values(published_at=func.now()))
        s.commit()
    if redis is not None:
        for snap in latest.values():
            snapshots.cache_latest(redis, snap)
    return stats


def load(sm: sessionmaker, redis: Redis | None, cfg: EngineConfig, campus: Campus,
         progress: bool = False) -> dict[str, Any]:
    t0 = time.time()
    with sm.begin() as s:
        snapshots.register_config(s, cfg)
    if already_loaded(sm, campus):
        return {"already_loaded": True}
    ingested = ingest_all(sm, campus)
    stats = replay(sm, redis, cfg, campus, progress)
    with sm.begin() as s:
        outcomes = label_due_loans(s, cfg, campus.now)
    return {"already_loaded": False, "ingested": ingested, **stats, "outcomes": outcomes,
            "seconds": round(time.time() - t0, 1), **campus.summary()}


def write_cohorts(campus: Campus, path: Path) -> None:
    """Year of study per student, for the fairness check. Held outside the database and never a scoring input."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["user_id", "cohort"])
        w.writerows(sorted(campus.cohorts.items()))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--students", type=int, default=600)
    ap.add_argument("--vendors", type=int, default=30)
    ap.add_argument("--days", type=int, default=180)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--now", help="ISO time the campus ends at (default: now)")
    ap.add_argument("--cohorts", default="data/cohorts.csv", help="where to write the year-of-study file")
    args = ap.parse_args()

    configure_logging(logging.WARNING)
    settings = get_settings()
    cfg = load_config(settings.scorecard_path, settings.policy_path)
    now = datetime.fromisoformat(args.now) if args.now else datetime.now(UTC)
    campus = generate(seed=args.seed, students=args.students, vendors=args.vendors, days=args.days, now=now)
    print(f"Simulated campus: {campus.summary()['students']} fake students, {campus.summary()['vendors']} fake "
          f"vendors, {campus.summary()['loans']} loans, {campus.summary()['events']} events (seed {args.seed}).")
    sm = make_sessionmaker(make_engine(settings.database_url))
    result = load(sm, Redis.from_url(settings.redis_url, decode_responses=True), cfg, campus, progress=True)
    if result["already_loaded"]:
        print("This campus is already loaded. `make reset` clears the local database for a fresh start.")
        return
    write_cohorts(campus, Path(args.cohorts))
    print(f"Loaded in {result['seconds']}s: {result['snapshots']} event snapshots, {result['sweeps']} re-score sweeps, "
          f"{result['alerts']} fraud alerts raised, {result['decisions']} partner decisions, "
          f"{result['outcomes']} labelled outcomes. Cohorts for the fairness check: {args.cohorts}")


if __name__ == "__main__":
    main()
