"""Ops risk console: the risk list, one user's full picture, an ops what-if, the monitoring overview and audit trails.
Signed BFF calls with an ops JWT, like every ops endpoint."""

from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field
from sqlalchemy import Text, cast, func, select
from sqlalchemy.dialects.postgresql import distinct_on
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_session
from app.api.ops_auth import Actor, ensure, require_ops
from app.api.simulate import WhatIf, run_what_if
from app.db.models import AuditLog, Event, FraudAlert, LimitLadderState, Override, ScoreSnapshot, User
from app.monitoring.service import overview
from app.ops import alerts as al
from app.ops import overrides as ov
from app.ops import risk

router = APIRouter(prefix="/v1/ops", tags=["ops"])

BANDS = Literal["A", "B", "C", "D", "E"]
TIERS = Literal["reset_arc", "side_quest", "locked_in", "main_character", "aura_farmer"]


def _latest():
    """Each user's latest snapshot."""
    sub = (select(ScoreSnapshot).ext(distinct_on(ScoreSnapshot.user_id))
           .order_by(ScoreSnapshot.user_id, ScoreSnapshot.as_of.desc(), ScoreSnapshot.id.desc()).subquery())
    return aliased(ScoreSnapshot, sub)


@router.get("/users")
def list_users(
    _: Annotated[Actor, Depends(require_ops("risk.view"))],
    session: Annotated[Session, Depends(get_session)],
    band: BANDS | None = None,
    tier: TIERS | None = None,
    knockout: Annotated[str | None, Query(pattern=r"^KO_[A-Z0-9_]+$")] = None,
    q: Annotated[str | None, Query(min_length=4, max_length=36, pattern=r"^[0-9a-fA-F-]+$")] = None,
    sort: Literal["riskiest", "recent"] = "riskiest",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, Any]:
    """Latest snapshot per user, filterable by band, tier and knockout; `q` matches part of an id."""
    s = _latest()
    stmt = select(s, User.synthetic).join(User, User.id == s.user_id)
    if band:
        stmt = stmt.where(s.band == band)
    if tier:
        stmt = stmt.where(s.tier == tier)
    if knockout:
        stmt = stmt.where(s.knockouts.contains([knockout]))
    if q:
        stmt = stmt.where(cast(s.user_id, Text).ilike(f"%{q.lower()}%"))
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    order = (s.krs.asc(), s.user_id) if sort == "riskiest" else (s.as_of.desc(), s.user_id)
    page = session.execute(stmt.order_by(*order).limit(limit).offset(offset)).all()
    ids = [snap.user_id for snap, _ in page]
    open_alerts = dict(session.execute(
        select(FraudAlert.user_id, func.count()).where(FraudAlert.user_id.in_(ids), FraudAlert.status == "open")
        .group_by(FraudAlert.user_id)).all()) if ids else {}
    return {"total": total, "limit": limit, "offset": offset, "rows": [
        risk.row(risk.snapshot_from_row(snap), user_id=str(snap.user_id), synthetic=bool(synthetic),
                 open_alerts=open_alerts.get(snap.user_id, 0)) for snap, synthetic in page]}


@router.get("/users/{user_id}")
def user_detail(
    user_id: UUID,
    _: Annotated[Actor, Depends(require_ops("risk.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Everything about one user's score: the latest snapshot with points per factor, the last 30 snapshots with what
    changed, the last 200 events, ladder state, fraud alerts and overrides."""
    user = session.get(User, user_id)
    snaps = list(session.scalars(select(ScoreSnapshot).where(ScoreSnapshot.user_id == user_id)
                                 .order_by(ScoreSnapshot.as_of.desc(), ScoreSnapshot.id.desc()).limit(30)))
    if user is None or not snaps:
        raise HTTPException(404, detail={"code": "NO_SCORE"})
    events = session.scalars(select(Event).where(Event.user_id == user_id)
                             .order_by(Event.occurred_at.desc()).limit(200))
    ladder = session.get(LimitLadderState, user_id)
    alerts = session.scalars(select(FraudAlert).where(FraudAlert.user_id == user_id)
                             .order_by(FraudAlert.last_seen_at.desc()))
    overrides = session.scalars(select(Override).where(Override.user_id == user_id)
                                .order_by(Override.created_at.desc()))
    return risk.detail(
        str(user_id), risk.snapshot_from_row(snaps[0]), [risk.snapshot_from_row(x) for x in snaps],
        [risk.event_item(e.event_id, e.type, e.occurred_at, e.source, e.synthetic, e.payload) for e in events],
        {"level": ladder.level, "clean_cycles_at_level": ladder.clean_cycles_at_level, "frozen": ladder.frozen,
         "last_step_up_at": ladder.last_step_up_at.isoformat() if ladder.last_step_up_at else None,
         "as_of": ladder.as_of.isoformat() if ladder.as_of else None} if ladder else None,
        [al.as_json(a) for a in alerts], [ov.as_json(o) for o in overrides], bool(user.synthetic),
    )


class OpsWhatIf(BaseModel):
    model_config = ConfigDict(extra="forbid")
    events: Annotated[list[WhatIf], Field(min_length=1, max_length=10)]
    horizon: AwareDatetime | None = None


@router.post("/users/{user_id}/simulate")
def ops_simulate(
    user_id: UUID,
    body: OpsWhatIf,
    request: Request,
    _: Annotated[Actor, Depends(require_ops("risk.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """The simulate panel: the same what-if students get, with KRS and band shown. Nothing is saved."""
    return run_what_if(session, user_id, body.events, body.horizon, request.app.state.config)


@router.get("/monitoring")
def monitoring(
    request: Request,
    _: Annotated[Actor, Depends(require_ops("monitoring.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Band and Aura distribution, approval and partner agreement, DPD roll rates, alerts, data freshness, KRS drift
    (PSI, month on month), calibration per band, Gini and KS on labelled loans, and v2 readiness."""
    return overview(session, request.app.state.config)


@router.get("/audit")
def audit_trail(
    target: Annotated[str, Query(pattern=r"^(override|fraud_alert):[0-9a-f-]{36}$")],
    actor: Annotated[Actor, Depends(require_ops("alerts.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> list[dict[str, Any]]:
    """Every audit entry for one override or alert, oldest first."""
    ensure(actor, "overrides.view" if target.startswith("override:") else "alerts.view")
    rows = session.scalars(select(AuditLog).where(AuditLog.target == target).order_by(AuditLog.at, AuditLog.id))
    return [{"id": str(a.id), "actor_id": str(a.actor_id), "action": a.action, "at": a.at.isoformat(),
             "before": a.before, "after": a.after} for a in rows]
