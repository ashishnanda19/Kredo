"""Score reads for the BFF (and later ops). Signed like every service call; students never reach this service."""

from datetime import UTC, date, datetime, timedelta
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import Text, cast, select
from sqlalchemy.orm import Session

from app.api.deps import Caller, get_session, require_hmac
from app.api.models import HistoryOut, ScoreOut
from app.db.models import Event
from app.db.repositories import to_record
from app.domain.dpd import ist_date
from app.domain.records import EventRecord
from app.scoring import snapshots, timeline
from app.scoring.engine import score
from app.scoring.knockouts import KNOCKOUTS

router = APIRouter(prefix="/v1/users", tags=["scores"])

NOT_FOUND = {404: {"description": "No score yet for this user"}}


def _latest_or_404(session: Session, user_id: UUID):
    snap = snapshots.latest(session, user_id)
    if snap is None:
        raise HTTPException(404, detail={"code": "NO_SCORE"})
    return snap


def user_events(session: Session, user_id: UUID, as_of: datetime) -> list[EventRecord]:
    rows = session.scalars(select(Event).where(Event.user_id == user_id, Event.occurred_at <= as_of)
                           .order_by(Event.occurred_at, cast(Event.event_id, Text)))
    return [to_record(r) for r in rows]


@router.get("/{user_id}/score", responses=NOT_FOUND, response_model=ScoreOut)
def get_score(
    user_id: UUID,
    request: Request,
    _: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Latest snapshot. Served from the Redis cache when present, else from the database. `ladder_levels` comes from
    the active policy, for the L1 to L6 display."""
    view = snapshots.cached(request.app.state.redis, user_id) or snapshots.public_view(_latest_or_404(session, user_id))
    levels = request.app.state.config.policy.ladder.levels
    return {**view, "ladder_levels": [{"level": x.level, "amount_paise": x.limit_paise} for x in levels]}


@router.get("/{user_id}/score/history", responses=NOT_FOUND, response_model=HistoryOut)
def get_history(
    user_id: UUID,
    request: Request,
    _: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
    from_: Annotated[date | None, Query(alias="from")] = None,
    to: date | None = None,
) -> dict[str, Any]:
    """Daily Aura (IST days) and the repayments and level changes that moved it. Defaults to the last 90 days."""
    now = datetime.now(UTC)
    events = user_events(session, user_id, now)
    if not events:
        raise HTTPException(404, detail={"code": "NO_SCORE"})
    end = to or ist_date(now)
    start = from_ or end - timedelta(days=90)
    if start > end or (end - start).days > 400:
        raise HTTPException(422, detail={"code": "BAD_RANGE"})
    cfg = request.app.state.config
    return timeline.history(events, score(events, now, cfg), start, end, cfg)


@router.get("/{user_id}/score/explain", responses=NOT_FOUND)
def explain(
    user_id: UUID,
    _: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Everything behind the latest number: feature values, points per factor with the bin hit, knockouts with
    their way out, and the versions. Internal view; the BFF reduces it to reason codes for students.
    """
    snap = _latest_or_404(session, user_id)
    return {
        **snapshots.public_view(snap),
        "features": snap.features,
        "points": snap.points,
        "knockouts": [{"code": k, "message": KNOCKOUTS[k][0], "way_out": KNOCKOUTS[k][1]} for k in snap.knockouts],
        "input_event_count": len(snap.input_event_ids),
        "trigger_event_id": str(snap.trigger_event_id) if snap.trigger_event_id else None,
    }
