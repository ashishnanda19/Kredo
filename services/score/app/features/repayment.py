"""F1 on-time rate, F2 worst lateness, F3 current overdue.

Days past due inside the grace period count as 0 here, so paying on the grace day is never "late" in the score.
"""

from datetime import datetime

from app.config.schema import PolicyConfig, ScorecardConfig
from app.features.common import in_window, recency_weight
from app.features.history import History


def _lateness(dpd: int, grace_days: int) -> int:
    return dpd if dpd > grace_days else 0


def ontime_rate(h: History, t: datetime, sc: ScorecardConfig, pol: PolicyConfig) -> float | None:
    """Recency-weighted share of loans paid in full on time, among loans whose outcome is known. None: none known.

    A loan's outcome is known once it is paid on time, or once its grace period has ended (paid or not). Weights and
    the 12-month window run from the due date, never from the payment date, so paying an overdue loan can never
    lower this rate compared with leaving it unpaid, and paying sooner can never lower it either.
    """
    f = sc.factors.f1_ontime_rate
    r = pol.repayment
    num = den = 0.0
    for loan in h.loans:
        on_time = loan.on_time_by(t, r.grace_days, r.early_days)
        due_at = loan.grace_ends_at(r.grace_days)
        known = on_time or t >= due_at or loan.negative_by(t)
        if loan.disbursed_at > t or not known or not in_window(t, min(due_at, t), f.window_days):
            continue
        w = recency_weight(t, due_at, sc.recency_half_life_days)
        if loan.is_quick(sc.quick_repay.days):
            w *= sc.quick_repay.weight
        den += w
        if on_time:
            num += w
    return num / den if den else None


def worst_lateness(h: History, t: datetime, sc: ScorecardConfig, pol: PolicyConfig) -> int:
    """Worst days past due among loans still open or finished in the last 6 months."""
    window = sc.factors.f2_worst_lateness.window_days
    worst = 0
    for loan in h.loans:
        if loan.disbursed_at > t:
            continue
        fin = loan.finished_at(t)
        if fin is None or in_window(t, fin, window):
            worst = max(worst, _lateness(loan.dpd(t), pol.repayment.grace_days))
    return worst


def current_overdue(h: History, t: datetime, pol: PolicyConfig) -> int:
    return max((_lateness(loan.dpd(t), pol.repayment.grace_days) for loan in h.loans if loan.is_open(t)), default=0)
