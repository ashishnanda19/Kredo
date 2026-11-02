"""All database writes go through here. Nothing in this module updates or deletes an append-only table."""

from collections.abc import Iterable, Sequence
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Text, cast, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.models import (
    Consent,
    Event,
    IdentityLink,
    Loan,
    Outbox,
    PaymentAttempt,
    Repayment,
    Spend,
    User,
    Vendor,
)
from app.domain.enums import EventType
from app.domain.loans import LoanView
from app.domain.records import EventRecord


def to_record(row: Event) -> EventRecord:
    return EventRecord(
        event_id=row.event_id,
        type=EventType(row.type),
        user_id=row.user_id,
        occurred_at=row.occurred_at,
        payload=row.payload,
        synthetic=row.synthetic,
    )


class EventRepository:
    def __init__(self, session: Session) -> None:
        self.s = session

    def insert_new(self, rows: Sequence[dict]) -> set[UUID]:
        """Inserts rows whose idempotency key and event id are both new. Returns the event ids actually written."""
        if not rows:
            return set()
        stmt = insert(Event).values(list(rows)).on_conflict_do_nothing().returning(Event.event_id)
        return set(self.s.scalars(stmt))

    def hashes_by_key(self, keys: Iterable[str]) -> dict[str, tuple[UUID, str]]:
        stmt = select(Event.idempotency_key, Event.event_id, Event.body_hash).where(Event.idempotency_key.in_(keys))
        return {k: (eid, h) for k, eid, h in self.s.execute(stmt)}

    def add_to_outbox(self, event_ids: Iterable[UUID]) -> None:
        values = [{"event_id": e} for e in event_ids]
        if values:
            self.s.execute(insert(Outbox).values(values))

    def get(self, event_id: UUID) -> Event | None:
        return self.s.get(Event, event_id)

    def for_loan(self, loan_id: UUID) -> list[EventRecord]:
        rows = self.s.scalars(select(Event).where(Event.loan_id == loan_id))
        return [to_record(r) for r in rows]

    def latest_of_type(self, user_id: UUID, event_type: EventType) -> Event | None:
        stmt = (
            select(Event)
            .where(Event.user_id == user_id, Event.type == event_type.value)
            .order_by(Event.occurred_at.desc(), cast(Event.event_id, Text).desc())
            .limit(1)
        )
        return self.s.scalars(stmt).first()

    def lock_user(self, user_id: UUID) -> None:
        """Serialises work on one user across consumers for the rest of the transaction."""
        self.lock(str(user_id))

    def lock(self, name: str) -> None:
        self.s.execute(select(func.pg_advisory_xact_lock(func.hashtextextended(name, 0))))


class OutboxRepository:
    def __init__(self, session: Session) -> None:
        self.s = session

    def claim_unpublished(self, limit: int) -> list[tuple[int, UUID, UUID, str]]:
        stmt = (
            select(Outbox.id, Outbox.event_id, Event.user_id, Event.type)
            .join(Event, Event.event_id == Outbox.event_id)
            .where(Outbox.published_at.is_(None))
            .order_by(Outbox.id)
            .limit(limit)
            .with_for_update(of=Outbox, skip_locked=True)
        )
        return [tuple(r) for r in self.s.execute(stmt)]

    def mark_published(self, ids: Sequence[int]) -> None:
        self.s.execute(update(Outbox).where(Outbox.id.in_(ids)).values(published_at=func.now()))


class ProjectionRepository:
    """Read-model tables rebuilt from events. Every write is an idempotent upsert keyed by entity or event id."""

    def __init__(self, session: Session) -> None:
        self.s = session

    def touch_user(self, user_id: UUID, seen_at: datetime, synthetic: bool) -> None:
        stmt = insert(User).values(id=user_id, created_at=seen_at, synthetic=synthetic)
        stmt = stmt.on_conflict_do_update(
            index_elements=[User.id],
            set_={
                "created_at": func.least(User.created_at, stmt.excluded.created_at),
                "synthetic": User.synthetic | stmt.excluded.synthetic,
            },
        )
        self.s.execute(stmt)

    def set_identity(self, user_id: UUID, kyc_level: str, college_verified: bool, phone_first_seen_at: date | None):
        self.s.execute(
            update(User)
            .where(User.id == user_id)
            .values(kyc_level=kyc_level, college_verified=college_verified, phone_first_seen_at=phone_first_seen_at)
        )

    def touch_vendor(self, vendor_id: UUID, seen_at: datetime, synthetic: bool) -> None:
        stmt = insert(Vendor).values(id=vendor_id, onboarded_at=seen_at, synthetic=synthetic)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Vendor.id],
            set_={"onboarded_at": func.least(Vendor.onboarded_at, stmt.excluded.onboarded_at)},
        )
        self.s.execute(stmt)

    def upsert_loan(self, v: LoanView) -> None:
        values = {
            "id": v.loan_id,
            "user_id": v.user_id,
            "principal": v.principal,
            "fees": v.fees,
            "outstanding": v.outstanding,
            "due_date": v.due_date,
            "state": v.state.value,
            "opened_at": v.opened_at,
            "closed_at": v.closed_at,
            "paid_in_full_at": v.paid_in_full_at,
            "closure_type": v.closure_type.value if v.closure_type else None,
            "max_dpd": v.max_dpd,
            "synthetic": v.synthetic,
        }
        stmt = insert(Loan).values(values)
        changes = {k: stmt.excluded[k] for k in values if k != "id"}
        stmt = stmt.on_conflict_do_update(index_elements=[Loan.id], set_={**changes, "updated_at": func.now()})
        self.s.execute(stmt)

    def add_repayment(self, event_id: UUID, loan_id: UUID, amount: int, paid_at: datetime, rail: str) -> None:
        stmt = insert(Repayment).values(id=event_id, loan_id=loan_id, amount=amount, paid_at=paid_at, rail=rail)
        self.s.execute(stmt.on_conflict_do_nothing())

    def add_failed_attempt(self, event_id: UUID, loan_id: UUID, amount: int, failure_class: str, rail: str,
                           at: datetime) -> None:
        stmt = insert(PaymentAttempt).values(
            id=event_id, loan_id=loan_id, amount=amount, status="failed", failure_class=failure_class, rail=rail,
            attempted_at=at,
        )
        self.s.execute(stmt.on_conflict_do_nothing())

    def add_consent(self, event_id: UUID, user_id: UUID, purpose: str, granted: bool, at: datetime,
                    text_version: str) -> None:
        stmt = insert(Consent).values(
            id=event_id, user_id=user_id, purpose=purpose, granted=granted, at=at, text_version=text_version
        )
        self.s.execute(stmt.on_conflict_do_nothing())

    def add_spend(self, event_id: UUID, user_id: UUID, loan_id: UUID, vendor_id: UUID, amount: int, at: datetime,
                  synthetic: bool) -> None:
        stmt = insert(Spend).values(event_id=event_id, user_id=user_id, loan_id=loan_id, vendor_id=vendor_id,
                                    amount=amount, at=at, synthetic=synthetic)
        self.s.execute(stmt.on_conflict_do_nothing())

    def add_identity_link(self, kind: str, digest: str, user_id: UUID, seen_at: datetime) -> None:
        stmt = insert(IdentityLink).values(kind=kind, digest=digest, user_id=user_id, first_seen_at=seen_at)
        stmt = stmt.on_conflict_do_update(
            index_elements=[IdentityLink.kind, IdentityLink.digest, IdentityLink.user_id],
            set_={"first_seen_at": func.least(IdentityLink.first_seen_at, stmt.excluded.first_seen_at)},
        )
        self.s.execute(stmt)
