from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import AuditLog
from app.util.ids import uuid7


def record(session: Session, actor_id: UUID, action: str, target: str, before: dict[str, Any] | None,
           after: dict[str, Any] | None) -> None:
    """Append one row to the audit log (append-only at the database). Ids and decisions only, never personal data."""
    session.add(AuditLog(id=uuid7(), actor_id=actor_id, action=action, target=target, before=before, after=after))
