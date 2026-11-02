"""What-if simulation for the BFF, and demo presets for the demo controls. Neither changes a real score."""

from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy.orm import Session

from app.api.deps import Caller, get_session, get_settings, require_hmac
from app.api.models import PresetOut, SimulateOut
from app.api.scores import user_events
from app.config.loader import EngineConfig
from app.devtools import presets
from app.domain.enums import EventType, Source
from app.events.ingest import ingest
from app.events.schemas import PAYLOADS, EventBatch
from app.features.history import History
from app.scoring import timeline
from app.settings import Settings
from app.util.ids import uuid7

router = APIRouter(prefix="/v1", tags=["simulate"])


class WhatIf(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["repayment_received", "loan_closed"]
    occurred_at: AwareDatetime
    payload: dict[str, Any]


class SimulateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: UUID
    events: Annotated[list[WhatIf], Field(min_length=1, max_length=10)]
    # project every option to this moment so they compare fairly (default: just after the last what-if)
    horizon: AwareDatetime | None = None


@router.post("/score/simulate", response_model=SimulateOut,
             responses={404: {"description": "No events for this user"}, 422: {"description": "Bad what-if"}})
def simulate(
    body: SimulateIn,
    request: Request,
    _: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """"If you repay ₹1,150 two days early": Aura now, and projected at `horizon` with the hypothetical events.
    Only repayments and closures of the student's own open loans, dated from now up to 120 days ahead. Nothing is
    saved; the result is an estimate, not a promise."""
    return run_what_if(session, body.user_id, body.events, body.horizon, request.app.state.config)


def run_what_if(session: Session, user_id: UUID, what_ifs: list[WhatIf], horizon: datetime | None,
                cfg: EngineConfig) -> dict[str, Any]:
    """Shared by the student what-if (via the BFF) and the ops simulate panel."""
    now = datetime.now(UTC)
    events = user_events(session, user_id, now)
    if not events:
        raise HTTPException(404, detail={"code": "NO_SCORE"})
    own = {str(x.loan_id) for x in History.build(events).loans if x.is_open(now)}
    spec = []
    for x in what_ifs:
        try:
            payload = PAYLOADS[EventType(x.type)].model_validate(x.payload).model_dump(mode="json")
        except ValidationError:
            raise HTTPException(422, detail={"code": "BAD_WHAT_IF"}) from None
        if payload["loan_id"] not in own:
            raise HTTPException(422, detail={"code": "NOT_AN_OPEN_LOAN"})
        if not now - timedelta(minutes=5) <= x.occurred_at <= now + timedelta(days=120):
            raise HTTPException(422, detail={"code": "BAD_WHAT_IF_DATE"})
        spec.append({"type": x.type, "occurred_at": x.occurred_at, "payload": payload})
    if horizon is not None and not now <= horizon <= now + timedelta(days=150):
        raise HTTPException(422, detail={"code": "BAD_HORIZON"})
    return timeline.simulate(events, timeline.hypothetical(events, spec), now, cfg, horizon)


@router.post("/demo/presets/{name}", status_code=201, response_model=PresetOut,
             responses={403: {"description": "Presets are off, or this key may not send demo events"}})
def load_preset(
    name: Literal[tuple(presets.PRESETS)],  # type: ignore[valid-type]
    caller: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Creates a new fake student with this preset's history (synthetic events, source demo_controls). The worker
    scores it within a moment. Off unless SCORE_DEMO_PRESETS=true; never enable it next to real data."""
    if not settings.demo_presets or Source.DEMO_CONTROLS not in caller.sources:
        raise HTTPException(403, detail={"code": "PRESETS_DISABLED"})
    user_id = uuid7()
    wire = presets.build(name, user_id, datetime.now(UTC))
    batch = EventBatch.model_validate({"events": wire})
    ingest(session, list(batch.events), mandates_enabled=settings.feature_mandates)
    return {"preset": name, "user_id": str(user_id), "events": len(wire)}
