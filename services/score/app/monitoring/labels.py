"""Outcome labels for the v2 model. Pure.

A loan is labelled `window_days` after its due date (60 by default, label_version 1). It is bad if it reached
`bad_dpd` days past due (30) inside that window, or was settled, restructured or written off by then. DPD only grows
until a loan is cleared, so the worst DPD inside the window is its DPD at the window's end.
"""

from dataclasses import dataclass
from datetime import datetime, time, timedelta

from app.config.schema import LabelPolicy
from app.domain.dpd import IST
from app.features.history import LoanFacts


@dataclass(frozen=True, slots=True)
class Label:
    bad: bool
    worst_dpd: int
    closure_type: str | None
    reason: str  # dpd | negative_closure | good
    observed_at: datetime


def window_end(loan: LoanFacts, pol: LabelPolicy) -> datetime:
    """The first instant the loan's label is known: the start of the India-time day `window_days` after its due date."""
    return datetime.combine(loan.due_date + timedelta(days=pol.window_days), time(0), IST)


def is_labellable(loan: LoanFacts, now: datetime, pol: LabelPolicy) -> bool:
    return window_end(loan, pol) <= now


def label_loan(loan: LoanFacts, pol: LabelPolicy) -> Label:
    end = window_end(loan, pol)
    worst = loan.dpd(end)
    negative = loan.negative_by(end)
    reason = "negative_closure" if negative else "dpd" if worst >= pol.bad_dpd else "good"
    closure = loan.closure_type.value if loan.closed_by(end) and loan.closure_type else None
    return Label(bad=reason != "good", worst_dpd=worst, closure_type=closure, reason=reason, observed_at=end)
