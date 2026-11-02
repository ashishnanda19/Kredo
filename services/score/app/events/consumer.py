"""The `scorer` consumer group. Each message is handled in its own transaction under a per-user advisory lock
(project → fraud rules → rescore → snapshot), then the latest score is cached and the message acknowledged. Failures
stay pending, are retried via XAUTOCLAIM, and move to the dead-letter stream after `max_deliveries` attempts.
Logs carry ids only, never payloads.
"""

import logging
from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID

from redis import Redis
from redis.exceptions import ResponseError
from sqlalchemy.orm import Session, sessionmaker

from app.config.loader import EngineConfig
from app.db.models import ScoreSnapshot
from app.db.repositories import EventRepository, to_record
from app.events.projector import project
from app.fraud import service as fraud
from app.scoring import snapshots
from app.settings import Settings

log = logging.getLogger(__name__)

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(UTC)


def ensure_group(redis: Redis, settings: Settings) -> None:
    try:
        redis.xgroup_create(settings.stream, settings.stream_group, id="0", mkstream=True)
    except ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise


def handle_event(session: Session, event_id: UUID, as_of: datetime, cfg: EngineConfig) -> ScoreSnapshot | None:
    """Project the event, then rescore its user and write a snapshot, all in the caller's transaction."""
    repo = EventRepository(session)
    row = repo.get(event_id)
    if row is None:
        raise LookupError(f"event {event_id} not in the log")
    repo.lock_user(row.user_id)
    record = to_record(row)
    project(session, record, as_of)
    for alert in fraud.detect(session, record, as_of, cfg):
        log.warning("fraud_alert_raised", extra={"alert_id": str(alert.id), "rule": alert.rule,
                                                 "event_id": str(event_id)})
    result = snapshots.compute_for_user(session, row.user_id, as_of, cfg)
    return snapshots.save(session, result, cfg, trigger_event_id=event_id) if result else None


def _process(redis: Redis, sm: sessionmaker, settings: Settings, cfg: EngineConfig, entries, clock: Clock) -> int:
    done = 0
    for msg_id, fields in entries:
        try:
            with sm.begin() as session:
                snap = handle_event(session, UUID(fields["event_id"]), clock(), cfg)
        except Exception:
            log.exception("event_failed", extra={"msg_id": msg_id, "event_id": fields.get("event_id")})
            continue
        if snap is not None:
            snapshots.cache_latest(redis, snap)
        redis.xack(settings.stream, settings.stream_group, msg_id)
        done += 1
    return done


def consume_once(redis: Redis, sm: sessionmaker, settings: Settings, cfg: EngineConfig, consumer: str, *,
                 block_ms: int = 2000, count: int = 100, clock: Clock = utc_now) -> int:
    resp = redis.xreadgroup(settings.stream_group, consumer, {settings.stream: ">"}, count=count, block=block_ms)
    entries = [entry for _, batch in resp or [] for entry in batch]
    return _process(redis, sm, settings, cfg, entries, clock)


def reclaim_stale(redis: Redis, sm: sessionmaker, settings: Settings, cfg: EngineConfig, consumer: str, *,
                  min_idle_ms: int = 60_000, count: int = 100, clock: Clock = utc_now) -> int:
    """Dead-letters messages that keep failing, then retries the rest of the idle ones on this consumer."""
    pending = redis.xpending_range(settings.stream, settings.stream_group, min="-", max="+", count=count,
                                   idle=min_idle_ms)
    for p in pending:
        if p["times_delivered"] >= settings.max_deliveries:
            msg_id = p["message_id"]
            for _, fields in redis.xrange(settings.stream, min=msg_id, max=msg_id):
                redis.xadd(settings.stream_dlq, {**fields, "source_id": msg_id, "deliveries": p["times_delivered"]})
            redis.xack(settings.stream, settings.stream_group, msg_id)
            log.error("event_dead_lettered", extra={"msg_id": msg_id})
    _, claimed, *_ = redis.xautoclaim(settings.stream, settings.stream_group, consumer, min_idle_time=min_idle_ms,
                                      start_id="0-0", count=count)
    return _process(redis, sm, settings, cfg, [c for c in claimed if c and c[1]], clock)
