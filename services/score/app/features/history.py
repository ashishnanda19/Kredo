"""One user's event log, reshaped once so features can be evaluated cheaply at many points in time.

Facts are built from every event up to the scoring time. Each feature then asks "as of t" questions
(`paid_by(t)`, `is_open(t)`...), which gives the same answers as rebuilding from only the events up to t.
"""

from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from app.domain.dpd import IST, days_past_due, ist_date
from app.domain.enums import NEGATIVE_CLOSURES, ClosureType, Decision, EventType, FailureClass, LoanState
from app.domain.loans import fold_loan, repayment_timing
from app.domain.records import EventRecord

_FAR_FUTURE = datetime(9999, 1, 1, tzinfo=UTC)


@dataclass(frozen=True, slots=True)
class LoanFacts:
    loan_id: UUID
    disbursed_at: datetime
    principal: int
    fees: int
    limit: int | None
    due_date: date
    credits: tuple[tuple[datetime, int], ...]
    paid_in_full_at: datetime | None
    closure_type: ClosureType | None
    closed_at: datetime | None

    @property
    def owed(self) -> int:
        return self.principal + self.fees

    def paid_by(self, t: datetime) -> bool:
        return self.paid_in_full_at is not None and self.paid_in_full_at <= t

    def closed_by(self, t: datetime) -> bool:
        return self.closed_at is not None and self.closed_at <= t

    def negative_by(self, t: datetime) -> bool:
        return self.closed_by(t) and self.closure_type in NEGATIVE_CLOSURES

    def clean_by(self, t: datetime) -> bool:
        """Paid in full, and not settled, restructured or written off."""
        return self.paid_by(t) and not self.negative_by(t)

    def finished_at(self, t: datetime) -> datetime | None:
        done = [x for x in (self.paid_in_full_at, self.closed_at) if x is not None and x <= t]
        return min(done) if done else None

    def is_open(self, t: datetime) -> bool:
        return self.disbursed_at <= t and self.finished_at(t) is None

    def grace_ends_at(self, grace_days: int) -> datetime:
        """Start of the first India-time day after due date + grace: from here an unpaid loan is late."""
        return datetime.combine(self.due_date + timedelta(days=grace_days + 1), time(0), IST)

    def dpd(self, t: datetime) -> int:
        fin = self.finished_at(t)
        return days_past_due(self.due_date, ist_date(t), ist_date(fin) if fin else None)

    def timing(self, grace_days: int, early_days: int) -> LoanState | None:
        if self.paid_in_full_at is None:
            return None
        return repayment_timing(self.due_date, self.paid_in_full_at, grace_days=grace_days, early_days=early_days)

    def on_time_by(self, t: datetime, grace_days: int, early_days: int) -> bool:
        return self.clean_by(t) and self.timing(grace_days, early_days) in (LoanState.PAID_EARLY,
                                                                             LoanState.PAID_ON_TIME)

    def is_quick(self, days: int) -> bool:
        return self.paid_in_full_at is not None and self.paid_in_full_at - self.disbursed_at <= timedelta(days=days)


@dataclass(frozen=True, slots=True)
class Failure:
    at: datetime
    kind: str
    loan_id: UUID


@dataclass(frozen=True, slots=True)
class OverrideGrant:
    at: datetime
    override_id: UUID
    field: str
    value: int
    expires_at: datetime


@dataclass(frozen=True)
class History:
    user_id: UUID
    first_seen_at: datetime
    verified: tuple[tuple[datetime, dict], ...]
    loans: tuple[LoanFacts, ...]  # disbursed loans, in disbursal order
    failures: tuple[Failure, ...]  # reported failures; partial-payment shortfalls are derived in features/failures.py
    declines: tuple[datetime, ...]
    limit_requests: tuple[datetime, ...]
    bureau_reports: tuple[tuple[datetime, dict], ...]
    consents: tuple[tuple[datetime, str, bool], ...]
    flags: tuple[tuple[datetime, str, bool, str | None], ...]  # (at, flag_type, set?, ref)
    override_grants: tuple[OverrideGrant, ...]
    override_revocations: tuple[tuple[datetime, UUID], ...]
    event_ids: tuple[UUID, ...]

    @classmethod
    def build(cls, events: Sequence[EventRecord]) -> "History":
        if not events:
            raise ValueError("no events")
        ordered = sorted(events, key=lambda e: e.sort_key)
        by_loan: dict[str, list[EventRecord]] = defaultdict(list)
        verified, failures, declines, requests, bureau, consents, flags = [], [], [], [], [], [], []
        grants, revocations = [], []
        for e in ordered:
            p = e.payload
            if "loan_id" in p:
                by_loan[p["loan_id"]].append(e)
            match e.type:
                case EventType.USER_VERIFIED:
                    verified.append((e.occurred_at, dict(p)))
                case EventType.PAYMENT_FAILED | EventType.MANDATE_BOUNCE:
                    if p["failure_class"] != FailureClass.TECHNICAL:
                        failures.append(Failure(e.occurred_at, e.type.value, UUID(p["loan_id"])))
                case EventType.PROMISE_TO_PAY_BROKEN:
                    failures.append(Failure(e.occurred_at, e.type.value, UUID(p["loan_id"])))
                case EventType.OVERRIDE_APPROVED:
                    grants.append(OverrideGrant(e.occurred_at, UUID(p["override_id"]), p["field"], p["value"],
                                                datetime.fromisoformat(p["expires_at"])))
                case EventType.OVERRIDE_REVOKED:
                    revocations.append((e.occurred_at, UUID(p["override_id"])))
                case EventType.LOAN_DECIDED if p["decision"] == Decision.DECLINED:
                    declines.append(e.occurred_at)
                case EventType.LIMIT_INCREASE_REQUESTED:
                    requests.append(e.occurred_at)
                case EventType.BUREAU_REPORT_RECEIVED:
                    bureau.append((e.occurred_at, dict(p)))
                case EventType.CONSENT_CHANGED:
                    consents.append((e.occurred_at, p["purpose"], p["granted"]))
                case EventType.FRAUD_FLAG_SET | EventType.FRAUD_FLAG_CLEARED:
                    flags.append((e.occurred_at, p["flag_type"], e.type == EventType.FRAUD_FLAG_SET, p.get("ref")))

        loans = []
        for loan_id, loan_events in by_loan.items():
            facts = _loan_facts(UUID(loan_id), loan_events)
            if facts is not None:
                loans.append(facts)
        loans.sort(key=lambda f: (f.disbursed_at, str(f.loan_id)))
        return cls(
            user_id=ordered[0].user_id,
            first_seen_at=verified[0][0] if verified else ordered[0].occurred_at,
            verified=tuple(verified),
            loans=tuple(loans),
            failures=tuple(failures),
            declines=tuple(declines),
            limit_requests=tuple(requests),
            bureau_reports=tuple(bureau),
            consents=tuple(consents),
            flags=tuple(flags),
            override_grants=tuple(grants),
            override_revocations=tuple(revocations),
            event_ids=tuple(sorted(e.event_id for e in ordered)),
        )

    def active_overrides(self, t: datetime) -> dict[str, OverrideGrant]:
        """field → the latest approved, unexpired and unrevoked override at t."""
        revoked = {oid for at, oid in self.override_revocations if at <= t}
        active: dict[str, OverrideGrant] = {}
        for g in self.override_grants:
            if g.at <= t < g.expires_at and g.override_id not in revoked:
                active[g.field] = g
        return active

    def kyc_level(self, t: datetime) -> str:
        level = "none"
        for at, payload in self.verified:
            if at <= t:
                level = payload["kyc_level"]
        return level

    def consent_at(self, t: datetime, purpose: str) -> tuple[bool, datetime | None]:
        """(granted now?, time of the latest change for this purpose)."""
        latest = None
        for at, p, granted in self.consents:
            if p == purpose and at <= t:
                latest = (granted, at)
        return latest if latest else (False, None)

    def active_flags(self, t: datetime) -> set[str]:
        """Flag types with at least one active (flag_type, ref) pair at t."""
        active: set[tuple[str, str | None]] = set()
        for at, flag, is_set, ref in self.flags:
            if at <= t:
                (active.add if is_set else active.discard)((flag, ref))
        return {flag for flag, _ in active}


def _loan_facts(loan_id: UUID, events: list[EventRecord]) -> LoanFacts | None:
    view = fold_loan(loan_id, events, _FAR_FUTURE)
    disbursed = next((e for e in reversed(events) if e.type == EventType.LOAN_DISBURSED), None)
    if view is None or disbursed is None:
        return None
    credits = []
    for e in events:
        if e.type == EventType.REPAYMENT_RECEIVED:
            credits.append((datetime.fromisoformat(e.payload["paid_at"]), e.payload["amount_paise"]))
        elif e.type == EventType.REFUND_ISSUED:
            credits.append((e.occurred_at, e.payload["amount_paise"]))
    return LoanFacts(
        loan_id=loan_id,
        disbursed_at=view.opened_at,
        principal=view.principal,
        fees=view.fees,
        limit=disbursed.payload.get("limit_paise"),
        due_date=view.due_date,
        credits=tuple(sorted(credits)),
        paid_in_full_at=view.paid_in_full_at,
        closure_type=view.closure_type,
        closed_at=view.closed_at,
    )
