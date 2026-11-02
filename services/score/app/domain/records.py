from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.enums import EventType


@dataclass(frozen=True, slots=True)
class EventRecord:
    """A stored event as the domain sees it. `payload` is the JSON form (ids, dates and times are strings)."""

    event_id: UUID
    type: EventType
    user_id: UUID
    occurred_at: datetime
    payload: Mapping[str, Any]
    synthetic: bool = False

    @property
    def sort_key(self) -> tuple[datetime, str]:
        return (self.occurred_at, str(self.event_id))
