"""Maker-checker overrides. A risk analyst proposes; a different risk admin approves, rejects or later revokes.

Approval writes an `override_approved` event into the log in the same transaction, so the override becomes an
ordinary scoring input: snapshots that used it replay exactly, and it expires on its own at `expires_at`.
"""

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.ops_auth import Actor
from app.config.loader import EngineConfig
from app.db.models import Override, User
from app.domain.enums import EventType, OverrideField
from app.events import internal
from app.ops import audit
from app.util.ids import uuid7


class OverrideError(Exception):
    def __init__(self, status: int, code: str) -> None:
        super().__init__(code)
        self.status, self.code = status, code


def as_json(o: Override) -> dict[str, Any]:
    return {
        "id": str(o.id), "user_id": str(o.user_id), "field": o.field, "value": o.value["value"],
        "reason": o.reason, "maker_id": str(o.maker_id), "checker_id": str(o.checker_id) if o.checker_id else None,
        "status": o.status, "created_at": o.created_at.isoformat() if o.created_at else None,
        "decided_at": o.decided_at.isoformat() if o.decided_at else None, "expires_at": o.expires_at.isoformat(),
    }


def _validate_value(field: OverrideField, value: int, cfg: EngineConfig) -> None:
    ok = {
        OverrideField.LADDER_LEVEL: 0 <= value <= len(cfg.policy.ladder.levels),
        OverrideField.LIMIT_CAP_PAISE: value >= 0,
        OverrideField.PAUSE_NEW_LOANS: value == 1,
    }[field]
    if not ok:
        raise OverrideError(422, "BAD_OVERRIDE_VALUE")


def create(session: Session, actor: Actor, *, user_id: UUID, field: OverrideField, value: int, reason: str,
           expires_at: datetime, now: datetime, max_days: int, cfg: EngineConfig) -> Override:
    if session.get(User, user_id) is None:
        raise OverrideError(404, "UNKNOWN_USER")
    _validate_value(field, value, cfg)
    if not now < expires_at <= now + timedelta(days=max_days):
        raise OverrideError(422, "BAD_EXPIRY")
    o = Override(id=uuid7(), user_id=user_id, field=field.value, value={"value": value}, reason=reason,
                 maker_id=actor.id, status="pending", created_at=now, expires_at=expires_at)
    session.add(o)
    session.flush()
    audit.record(session, actor.id, "override.create", f"override:{o.id}", None, as_json(o))
    return o


def _locked(session: Session, override_id: UUID) -> Override:
    o = session.scalars(select(Override).where(Override.id == override_id).with_for_update()).first()
    if o is None:
        raise OverrideError(404, "UNKNOWN_OVERRIDE")
    return o


def _event(session: Session, o: Override, event_type: EventType, payload: dict, now: datetime) -> None:
    internal.write(session, event_type, user_id=o.user_id, key=f"override:{o.id}:{event_type.value}", at=now,
                   payload=payload, synthetic=bool(session.get(User, o.user_id).synthetic))


def decide(session: Session, actor: Actor, override_id: UUID, *, approve: bool, now: datetime) -> Override:
    o = _locked(session, override_id)
    if o.status != "pending":
        raise OverrideError(409, "NOT_PENDING")
    if actor.id == o.maker_id:
        raise OverrideError(403, "MAKER_CANNOT_DECIDE")
    if approve and o.expires_at <= now:
        raise OverrideError(409, "ALREADY_EXPIRED")
    before = as_json(o)
    o.status, o.checker_id, o.decided_at = ("approved" if approve else "rejected"), actor.id, now
    if approve:
        _event(session, o, EventType.OVERRIDE_APPROVED, {"override_id": str(o.id), "field": o.field,
                                                         "value": o.value["value"],
                                                         "expires_at": o.expires_at.isoformat()}, now)
    session.flush()
    audit.record(session, actor.id, "override.approve" if approve else "override.reject", f"override:{o.id}",
                 before, as_json(o))
    return o


def revoke(session: Session, actor: Actor, override_id: UUID, *, now: datetime) -> Override:
    o = _locked(session, override_id)
    if o.status != "approved":
        raise OverrideError(409, "NOT_APPROVED")
    before = as_json(o)
    o.status = "revoked"
    _event(session, o, EventType.OVERRIDE_REVOKED, {"override_id": str(o.id)}, now)
    session.flush()
    audit.record(session, actor.id, "override.revoke", f"override:{o.id}", before, as_json(o))
    return o
