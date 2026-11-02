"""Writes events and their outbox rows in one transaction. Idempotent on `idempotency_key`.

A retry with the same key and the same body is a duplicate (reported, not stored again). The same key with a
different body is a conflict, and the whole batch is rejected so a caller never ends up half-written.
"""

import hashlib
import json
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.repositories import EventRepository
from app.domain.enums import EventType
from app.events.schemas import EnvelopeBase


class IdempotencyConflict(Exception):
    def __init__(self, keys: list[str]) -> None:
        super().__init__("idempotency key reused with a different body")
        self.keys = keys


class MandatesDisabled(Exception):
    pass


@dataclass
class IngestResult:
    accepted: list[UUID] = field(default_factory=list)
    duplicate: list[UUID] = field(default_factory=list)


def body_hash(event: EnvelopeBase) -> str:
    """Hash of everything but `event_id`, so a retry that mints a fresh event id still dedupes on its key.

    Null fields are left out, so "omitted" and "null" hash the same and adding an optional field to a contract never
    turns an honest retry into a conflict."""
    body = event.model_dump(mode="json", exclude={"event_id"}, exclude_none=True)
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _row(event: EnvelopeBase, digest: str) -> dict:
    payload = event.payload.model_dump(mode="json")
    return {
        "event_id": event.event_id,
        "idempotency_key": event.idempotency_key,
        "type": event.type,
        "user_id": event.user_id,
        "loan_id": payload.get("loan_id"),
        "occurred_at": event.occurred_at,
        "source": event.source.value,
        "schema_version": event.schema_version,
        "synthetic": event.synthetic,
        "payload": payload,
        "body_hash": digest,
    }


def ingest(session: Session, events: list[EnvelopeBase], *, mandates_enabled: bool,
           commit: bool = True) -> IngestResult:
    """`commit=False` lets a caller (the override flow) write events inside its own transaction."""
    if not mandates_enabled and any(e.type == EventType.MANDATE_BOUNCE for e in events):
        raise MandatesDisabled()

    result = IngestResult()
    repo = EventRepository(session)

    # dedupe inside the batch first
    first_by_key: dict[str, tuple[EnvelopeBase, str]] = {}
    conflicts: list[str] = []
    for e in events:
        digest = body_hash(e)
        seen = first_by_key.get(e.idempotency_key)
        if seen is None:
            first_by_key[e.idempotency_key] = (e, digest)
        elif seen[1] != digest:
            conflicts.append(e.idempotency_key)
    if conflicts:
        raise IdempotencyConflict(sorted(set(conflicts)))

    written = repo.insert_new([_row(e, d) for e, d in first_by_key.values()])
    missed = [k for k, (e, _) in first_by_key.items() if e.event_id not in written]
    stored = repo.hashes_by_key(missed) if missed else {}
    for key in missed:
        found = stored.get(key)
        if found is None or found[1] != first_by_key[key][1]:
            # same key with another body, or a reused event_id under a new key
            conflicts.append(key)
    if conflicts:
        if commit:  # otherwise the caller owns the transaction and rolls it back
            session.rollback()
        raise IdempotencyConflict(sorted(conflicts))

    repo.add_to_outbox(e.event_id for e, _ in first_by_key.values() if e.event_id in written)
    if commit:
        session.commit()

    stored_ids = {k: v[0] for k, v in stored.items()}
    for e in events:
        if e.event_id in written and e is first_by_key[e.idempotency_key][0]:
            result.accepted.append(e.event_id)
        else:
            result.duplicate.append(stored_ids.get(e.idempotency_key, first_by_key[e.idempotency_key][0].event_id))
    return result
