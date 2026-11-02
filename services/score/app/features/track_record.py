"""F9 track record: loans repaid in full, and time on Kredo. Also the closed-loan count behind thin-file and Fresh
Spawn. Counts repaid loans, never borrowed ones.
"""

from datetime import datetime

from app.config.schema import ScorecardConfig
from app.domain.dpd import ist_date
from app.features.history import History


def closed_count(h: History, t: datetime) -> int:
    """Loans finished by t, however they finished."""
    return sum(loan.finished_at(t) is not None for loan in h.loans)


def matured_count(h: History, t: datetime) -> int:
    """Loans whose due date has passed. Repayment timing cannot change this, which keeps thin-file monotone."""
    today = ist_date(t)
    return sum(loan.disbursed_at <= t and loan.due_date < today for loan in h.loans)


def closed_weighted(h: History, t: datetime, sc: ScorecardConfig) -> float:
    q = sc.quick_repay
    return sum(q.weight if loan.is_quick(q.days) else 1.0 for loan in h.loans if loan.clean_by(t))


def months_on_kredo(h: History, t: datetime) -> int:
    start, now = ist_date(h.first_seen_at), ist_date(t)
    months = (now.year - start.year) * 12 + now.month - start.month - (now.day < start.day)
    return max(0, months)
