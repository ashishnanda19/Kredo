"""Builders for synthetic test events. Ids come from uuid5 over readable names, so failures are easy to read."""

from datetime import UTC, date, datetime
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from app.domain.enums import EventType
from app.domain.records import EventRecord

T0 = datetime(2026, 10, 1, 6, 0, tzinfo=UTC)  # 11:30 IST


def uid(name: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"kredo-test:{name}")


def event(type_: EventType, user: str, payload: dict[str, Any], at: datetime = T0, key: str | None = None,
          source: str = "demo_controls") -> dict[str, Any]:
    """An event in its JSON wire form."""
    key = key or f"test:{type_.value}:{user}:{at.isoformat()}:{sorted(payload.items())}"
    return {
        "event_id": str(uid(key)),
        "idempotency_key": str(uid(key)),
        "type": type_.value,
        "user_id": str(uid(user)),
        "occurred_at": at.isoformat(),
        "source": source,
        "schema_version": 1,
        "synthetic": True,
        "payload": payload,
    }


def record(wire: dict[str, Any]) -> EventRecord:
    return EventRecord(
        event_id=UUID(wire["event_id"]),
        type=EventType(wire["type"]),
        user_id=UUID(wire["user_id"]),
        occurred_at=datetime.fromisoformat(wire["occurred_at"]),
        payload=wire["payload"],
        synthetic=wire["synthetic"],
    )


def disbursed(user: str, loan: str, principal: int, due: date, at: datetime = T0, fees: int = 0) -> dict[str, Any]:
    return event(EventType.LOAN_DISBURSED, user, {
        "loan_id": str(uid(loan)), "principal_paise": principal, "fees_paise": fees, "due_date": due.isoformat(),
        "vendor_ids": [],
    }, at)


def repaid(user: str, loan: str, amount: int, paid_at: datetime) -> dict[str, Any]:
    return event(EventType.REPAYMENT_RECEIVED, user, {
        "loan_id": str(uid(loan)), "amount_paise": amount, "paid_at": paid_at.isoformat(), "rail": "upi",
    }, paid_at)
