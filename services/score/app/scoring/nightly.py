"""Nightly job: `python -m app.scoring.nightly [--workers N]` (`make rescore`). Schedule it nightly (RUNBOOK.md).

1. Re-score everyone. Time moves scores even with no new events (overdue days age, old events decay), so every user
   gets a fresh snapshot. The work is split across `--workers` processes by user id; each user is handled under their
   advisory lock, so it is safe beside a running worker.
2. Label the loans whose label window has just closed, with their decision-time features (the v2 training data).
"""

import argparse
import logging
from concurrent.futures import ProcessPoolExecutor
from datetime import UTC, datetime

from redis import Redis
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.config.loader import EngineConfig, load_config
from app.db.models import User
from app.db.repositories import EventRepository
from app.db.session import make_engine, make_sessionmaker
from app.logs import configure_logging
from app.monitoring.outcomes import label_due_loans
from app.scoring import snapshots
from app.settings import get_settings

log = logging.getLogger(__name__)


def rescore_all(sm: sessionmaker, redis: Redis, cfg: EngineConfig, as_of: datetime, batch: int = 500,
                shard: tuple[int, int] | None = None) -> int:
    """Re-scores every user (or, with `shard=(i, n)`, the users whose id modulo n is i). Returns how many."""
    done = 0
    last = None
    while True:
        with sm() as s:
            stmt = select(User.id).order_by(User.id).limit(batch)
            ids = list(s.scalars(stmt.where(User.id > last) if last else stmt))
        if not ids:
            return done
        for user_id in ids:
            if shard is not None and user_id.int % shard[1] != shard[0]:
                continue
            with sm.begin() as s:
                EventRepository(s).lock_user(user_id)
                result = snapshots.compute_for_user(s, user_id, as_of, cfg)
                snap = snapshots.save(s, result, cfg, trigger_event_id=None) if result else None
            if snap is not None:
                snapshots.cache_latest(redis, snap)
                done += 1
        last = ids[-1]


def _run_shard(shard: int, workers: int, as_of: datetime) -> int:
    """One worker process: its own connections, its own slice of the users."""
    settings = get_settings()
    sm = make_sessionmaker(make_engine(settings.database_url))
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return rescore_all(sm, redis, load_config(settings.scorecard_path, settings.policy_path), as_of,
                       shard=(shard, workers))


def rescore_parallel(workers: int, as_of: datetime) -> int:
    if workers <= 1:
        return _run_shard(0, 1, as_of)
    with ProcessPoolExecutor(max_workers=workers) as pool:
        return sum(pool.map(_run_shard, range(workers), [workers] * workers, [as_of] * workers))


def main() -> None:
    ap = argparse.ArgumentParser(description="Nightly re-score and outcome labelling.")
    ap.add_argument("--workers", type=int, default=1, help="processes to split the re-score across")
    args = ap.parse_args()
    configure_logging()
    settings = get_settings()
    now = datetime.now(UTC)
    n = rescore_parallel(args.workers, now)
    log.info("nightly_rescore_done", extra={"count": n})
    cfg = load_config(settings.scorecard_path, settings.policy_path)
    with make_sessionmaker(make_engine(settings.database_url)).begin() as s:
        labelled = label_due_loans(s, cfg, now)
    log.info("outcomes_labelled", extra={"count": labelled})


if __name__ == "__main__":
    main()
