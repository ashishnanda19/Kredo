from typing import Annotated, Union

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import Caller, get_session, get_settings, require_hmac
from app.domain.enums import INTERNAL_EVENT_TYPES
from app.events.ingest import IdempotencyConflict, MandatesDisabled, ingest
from app.events.schemas import EventBatch, EventIn, IngestResponse
from app.settings import Settings

router = APIRouter(prefix="/v1", tags=["events"])

ERRORS = {
    401: {"description": "Missing or invalid HMAC signature"},
    403: {"description": "This key may not send events from that source"},
    409: {"description": "An idempotency key was reused with a different body; nothing was written"},
    413: {"description": "Batch larger than the configured maximum"},
    422: {"description": "Invalid event, or mandate events while FEATURE_MANDATES is off"},
}


@router.post("/events", status_code=202, response_model=IngestResponse, responses=ERRORS)
def post_events(
    body: Annotated[Union[EventBatch, EventIn], Body()],  # noqa: UP007
    caller: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> IngestResponse:
    """Ingest one event or a batch. Idempotent on `idempotency_key`: retries come back under `duplicate`."""
    events = list(body.events) if isinstance(body, EventBatch) else [body]
    if len(events) > settings.max_batch:
        raise HTTPException(413, detail={"code": "BATCH_TOO_LARGE", "max": settings.max_batch})
    if bad := sorted({e.source.value for e in events} - {s.value for s in caller.sources}):
        raise HTTPException(403, detail={"code": "SOURCE_NOT_ALLOWED", "sources": bad})
    if internal := sorted({e.type for e in events} & INTERNAL_EVENT_TYPES):
        # overrides only enter the log through the maker-checker flow in /v1/ops/overrides
        raise HTTPException(403, detail={"code": "INTERNAL_EVENT_TYPE", "types": internal})
    if any(getattr(e.payload, "ref", None) is not None for e in events):
        # flags tied to a fraud alert are set and cleared only through /v1/ops/fraud-alerts
        raise HTTPException(403, detail={"code": "INTERNAL_REF"})
    try:
        result = ingest(session, events, mandates_enabled=settings.feature_mandates)
    except IdempotencyConflict as e:
        raise HTTPException(409, detail={"code": "IDEMPOTENCY_CONFLICT", "idempotency_keys": e.keys}) from None
    except MandatesDisabled:
        raise HTTPException(422, detail={"code": "MANDATES_DISABLED"}) from None
    return IngestResponse(accepted=result.accepted, duplicate=result.duplicate)
