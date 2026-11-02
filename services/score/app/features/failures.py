"""F4 payment failures: declined or insufficient-funds attempts, broken promises to pay, and partial payments below
the minimum due on the due date. Technical failures (bank or UPI downtime) are dropped in History and never scored.
"""

from datetime import datetime, time, timedelta

from app.config.schema import PolicyConfig, ScorecardConfig
from app.domain.dpd import IST
from app.features.common import in_window, recency_weight
from app.features.history import History, LoanFacts


def _shortfall_at(loan: LoanFacts, pol: PolicyConfig) -> datetime | None:
    """End of the due date (IST) if something, but less than the minimum due, was paid by then."""
    end_of_due = datetime.combine(loan.due_date + timedelta(days=1), time(0), IST)
    paid = sum(amount for at, amount in loan.credits if at < end_of_due)
    if 0 < paid < pol.repayment.min_due_fraction * loan.owed:
        return end_of_due
    return None


def loan_failed_before(h: History, loan: LoanFacts, t: datetime, pol: PolicyConfig) -> bool:
    """Any scored payment failure on this loan up to t (clean-cycle check)."""
    if any(f.loan_id == loan.loan_id and f.at <= t for f in h.failures):
        return True
    at = _shortfall_at(loan, pol)
    return at is not None and at <= t


def failure_times(h: History, t: datetime, pol: PolicyConfig) -> list[datetime]:
    times = [f.at for f in h.failures if f.at <= t]
    for loan in h.loans:
        at = _shortfall_at(loan, pol)
        if at is not None and at <= t and not loan.negative_by(at):
            times.append(at)
    return sorted(times)


def failure_weight(h: History, t: datetime, sc: ScorecardConfig, pol: PolicyConfig) -> float:
    window = sc.factors.f4_payment_failures.window_days
    return sum(recency_weight(t, at, sc.recency_half_life_days)
               for at in failure_times(h, t, pol) if in_window(t, at, window))
