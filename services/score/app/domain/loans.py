"""Folds one loan's events into its current state. Pure: same events and `as_of` in, same view out, in any order."""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from uuid import UUID

from app.domain.dpd import days_past_due, ist_date
from app.domain.enums import NEGATIVE_CLOSURES, ClosureType, Decision, EventType, LoanState
from app.domain.records import EventRecord


@dataclass(frozen=True, slots=True)
class LoanView:
    loan_id: UUID
    user_id: UUID
    state: LoanState
    principal: int | None
    fees: int | None
    outstanding: int | None
    due_date: date | None
    opened_at: datetime | None
    closed_at: datetime | None
    paid_in_full_at: datetime | None
    closure_type: ClosureType | None
    max_dpd: int
    synthetic: bool


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


def fold_loan(
    loan_id: UUID,
    events: Iterable[EventRecord],
    as_of: datetime,
    *,
    grace_days: int = 1,
    early_days: int = 2,
) -> LoanView | None:
    """`grace_days` and `early_days` come from policy config once it exists (phase 2)."""
    mine = sorted(
        (e for e in events if e.payload.get("loan_id") == str(loan_id) and e.occurred_at <= as_of),
        key=lambda e: e.sort_key,
    )
    if not mine:
        return None

    applied = decided = disbursed = closed = None
    credits: list[tuple[datetime, int]] = []
    for e in mine:
        match e.type:
            case EventType.LOAN_APPLIED:
                applied = e
            case EventType.LOAN_DECIDED:
                decided = e
            case EventType.LOAN_DISBURSED:
                disbursed = e
            case EventType.LOAN_CLOSED:
                closed = e
            case EventType.REPAYMENT_RECEIVED:
                paid_at = _dt(e.payload["paid_at"])
                if paid_at <= as_of:
                    credits.append((paid_at, e.payload["amount_paise"]))
            case EventType.REFUND_ISSUED:
                credits.append((e.occurred_at, e.payload["amount_paise"]))

    principal = fees = outstanding = None
    due_date = opened_at = paid_in_full_at = None
    if disbursed is not None:
        principal = disbursed.payload["principal_paise"]
        fees = disbursed.payload["fees_paise"]
        due_date = date.fromisoformat(disbursed.payload["due_date"])
        opened_at = disbursed.occurred_at
        owed = principal + fees
        running = 0
        for at, amount in sorted(credits):
            running += amount
            if paid_in_full_at is None and running >= owed:
                paid_in_full_at = at
        outstanding = max(0, owed - running)

    closure_type = ClosureType(closed.payload["closure_type"]) if closed else None
    closed_at = closed.occurred_at if closed else None

    max_dpd = 0
    if due_date is not None:
        stops = [ist_date(t) for t in (paid_in_full_at, closed_at) if t is not None]
        max_dpd = days_past_due(due_date, ist_date(as_of), min(stops) if stops else None)

    state = _state(applied, decided, disbursed, closure_type, outstanding, due_date, paid_in_full_at, as_of,
                   grace_days, early_days)
    return LoanView(
        loan_id=loan_id,
        user_id=mine[0].user_id,
        state=state,
        principal=principal,
        fees=fees,
        outstanding=outstanding,
        due_date=due_date,
        opened_at=opened_at,
        closed_at=closed_at,
        paid_in_full_at=paid_in_full_at,
        closure_type=closure_type,
        max_dpd=max_dpd,
        synthetic=any(e.synthetic for e in mine),
    )


def _state(applied, decided, disbursed, closure_type, outstanding, due_date, paid_in_full_at, as_of,
           grace_days, early_days) -> LoanState:
    if closure_type is not None:
        return LoanState(closure_type.value) if closure_type in NEGATIVE_CLOSURES else LoanState.CLOSED
    if disbursed is not None:
        if outstanding == 0:
            return repayment_timing(due_date, paid_in_full_at, grace_days=grace_days, early_days=early_days)
        return LoanState.OVERDUE if ist_date(as_of) > due_date else LoanState.ACTIVE
    if decided is not None:
        return LoanState.OFFERED if decided.payload["decision"] == Decision.APPROVED else LoanState.DECLINED
    if applied is not None:
        return LoanState.APPLIED
    return LoanState.PENDING


def repayment_timing(due_date: date, paid_in_full_at: datetime, *, grace_days: int, early_days: int) -> LoanState:
    """Early = cleared `early_days`+ before the due date. On time = cleared by the due date plus the grace period."""
    paid_on = ist_date(paid_in_full_at)
    if paid_on <= due_date - timedelta(days=early_days):
        return LoanState.PAID_EARLY
    if paid_on <= due_date + timedelta(days=grace_days):
        return LoanState.PAID_ON_TIME
    return LoanState.PAID_LATE
