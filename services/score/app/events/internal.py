"""Events the service writes into its own log (source `ops`): override decisions and fraud-alert flags.

They go through the normal ingest path, in the caller's transaction, so they get an outbox row, are idempotent on
their key, and become ordinary scoring inputs that snapshots replay exactly.
"""

from datetime import datetime
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy.orm import Session

from app.domain.enums import EventType, Source
from app.events.ingest import ingest
from app.events.schemas import EVENT_MODELS
from app.util.ids import uuid7

MODEL_BY_TYPE = {m.model_fields["type"].annotation.__args__[0]: m for m in EVENT_MODELS}

# the actor on flags the service sets by itself (the velocity hold)
SYSTEM_ACTOR = uuid5(NAMESPACE_URL, "kredo-score:system")


def write(session: Session, event_type: EventType, *, user_id: UUID, key: str, at: datetime, payload: dict[str, Any],
          synthetic: bool) -> None:
    ev = MODEL_BY_TYPE[event_type.value].model_validate({
        "event_id": str(uuid7()), "idempotency_key": key, "type": event_type.value, "user_id": str(user_id),
        "occurred_at": at.isoformat(), "source": Source.OPS.value, "synthetic": synthetic, "payload": payload,
    })
    ingest(session, [ev], mandates_enabled=False, commit=False)
