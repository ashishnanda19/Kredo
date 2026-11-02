"""Persists score results (append-only snapshots plus the feature vector) and keeps the latest one in Redis."""

import json
from datetime import datetime
from typing import Any
from uuid import UUID

from redis import Redis
from sqlalchemy import Text, cast, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config.loader import EngineConfig, build_config
from app.db.models import ConfigVersion, Event, FeatureVector, LimitLadderState, ScoreSnapshot
from app.db.repositories import to_record
from app.scoring.engine import ScoreResult, score
from app.util.ids import uuid7

CACHE_KEY = "score:latest:{user_id}"

# Write only if this snapshot is at least as new as the cached one (as_of in microseconds since the epoch).
_CAS = """
local cur = redis.call('HGET', KEYS[1], 'as_of_us')
if cur and tonumber(cur) > tonumber(ARGV[1]) then return 0 end
redis.call('HSET', KEYS[1], 'as_of_us', ARGV[1], 'body', ARGV[2])
return 1
"""


def compute_for_user(session: Session, user_id: UUID, as_of: datetime, cfg: EngineConfig) -> ScoreResult | None:
    rows = session.scalars(select(Event).where(Event.user_id == user_id, Event.occurred_at <= as_of)
                           .order_by(Event.occurred_at, cast(Event.event_id, Text)))
    events = [to_record(r) for r in rows]
    return score(events, as_of, cfg) if events else None


def save(session: Session, result: ScoreResult, cfg: EngineConfig, trigger_event_id: UUID | None) -> ScoreSnapshot:
    snap = ScoreSnapshot(
        id=uuid7(),
        user_id=result.user_id,
        as_of=result.as_of,
        krs=result.krs,
        pd=result.pd,
        band=result.band,
        aura=result.aura,
        tier=result.tier,
        fresh_spawn=result.fresh_spawn,
        streak=result.streak,
        features={**result.features, "evaluated_at": result.evaluated_at.isoformat()},
        points=result.points_json(cfg.scorecard.calibration.base_score),
        reason_codes=result.reason_codes,
        knockouts=result.knockouts,
        limit_reco=result.limit_reco,
        input_event_ids=list(result.input_event_ids),
        scorecard_version=result.scorecard_version,
        policy_version=result.policy_version,
        config_hash=result.config_hash,
        trigger_event_id=trigger_event_id,
    )
    session.add(snap)
    session.add(FeatureVector(id=uuid7(), user_id=result.user_id, as_of=result.evaluated_at,
                              features=result.features, feature_set_version=cfg.scorecard.feature_set_version))
    session.flush()
    _project_ladder(session, result, snap.id)
    return snap


def _project_ladder(session: Session, result: ScoreResult, snapshot_id: UUID) -> None:
    lad = result.ladder
    values = {"user_id": result.user_id, "level": lad.level, "clean_cycles_at_level": lad.cycles_at_level,
              "frozen": lad.frozen, "last_step_up_at": lad.last_step_up_at, "as_of": result.as_of,
              "snapshot_id": snapshot_id}
    stmt = insert(LimitLadderState).values(values)
    # never let an older score overwrite a newer ladder position
    stmt = stmt.on_conflict_do_update(
        index_elements=[LimitLadderState.user_id],
        set_={**{k: stmt.excluded[k] for k in values if k != "user_id"}, "updated_at": func.now()},
        where=LimitLadderState.as_of.is_(None) | (LimitLadderState.as_of <= stmt.excluded.as_of),
    )
    session.execute(stmt)


def register_config(session: Session, cfg: EngineConfig) -> None:
    """Remember this config by hash so snapshots built with it stay replayable after it changes."""
    stmt = insert(ConfigVersion).values(
        hash=cfg.hash, scorecard_version=cfg.scorecard.version, policy_version=cfg.policy.version,
        scorecard=cfg.scorecard.model_dump(mode="json", by_alias=True),
        policy=cfg.policy.model_dump(mode="json", by_alias=True),
    )
    session.execute(stmt.on_conflict_do_nothing())


def config_for_hash(session: Session, config_hash: str) -> EngineConfig:
    row = session.get(ConfigVersion, config_hash)
    if row is None:
        raise LookupError(f"config {config_hash[:12]} is not registered")
    cfg = build_config(row.scorecard, row.policy)
    if cfg.hash != config_hash:
        raise ValueError("stored config no longer hashes to its key")
    return cfg


def public_view(snap: ScoreSnapshot) -> dict[str, Any]:
    """The GET /score shape. Internal fields (krs, pd, band, points) are stripped later by the BFF, not here."""
    return {
        "user_id": str(snap.user_id),
        "snapshot_id": str(snap.id),
        "as_of": snap.as_of.isoformat(),
        # differs from as_of only while the score is frozen (consent withdrawn): the moment it froze
        "evaluated_at": (snap.features or {}).get("evaluated_at", snap.as_of.isoformat()),
        "krs": snap.krs,
        "pd": snap.pd,
        "band": snap.band,
        "aura": snap.aura,
        "tier": snap.tier,
        "fresh_spawn": snap.fresh_spawn,
        "streak": snap.streak,
        "reason_codes": snap.reason_codes,
        "knockouts": snap.knockouts,
        "limit_reco": snap.limit_reco or None,
        "versions": {"scorecard": snap.scorecard_version, "policy": snap.policy_version,
                     "config_hash": snap.config_hash},
    }


def cache_latest(redis: Redis, snap: ScoreSnapshot) -> bool:
    as_of_us = int(snap.as_of.timestamp() * 1_000_000)
    return bool(redis.eval(_CAS, 1, CACHE_KEY.format(user_id=snap.user_id), as_of_us, json.dumps(public_view(snap))))


def cached(redis: Redis, user_id: UUID) -> dict[str, Any] | None:
    body = redis.hget(CACHE_KEY.format(user_id=user_id), "body")
    return json.loads(body) if body else None


def latest(session: Session, user_id: UUID) -> ScoreSnapshot | None:
    stmt = (select(ScoreSnapshot).where(ScoreSnapshot.user_id == user_id)
            .order_by(ScoreSnapshot.as_of.desc(), ScoreSnapshot.id.desc()).limit(1))
    return session.scalars(stmt).first()


def replay(session: Session, snap: ScoreSnapshot, cfg: EngineConfig | None = None) -> ScoreResult:
    """Recomputes a snapshot from exactly the events and the config it was built with."""
    if cfg is None or cfg.hash != snap.config_hash:
        cfg = config_for_hash(session, snap.config_hash)
    rows = session.scalars(select(Event).where(Event.event_id.in_(snap.input_event_ids)))
    return score([to_record(r) for r in rows], snap.as_of, cfg)
