"""F5 rollover, F6 stacking, F7 utilisation. Borrowing patterns can only cost points or hold steady, except low
utilisation, which rewards using less of the limit, never more.
"""

from datetime import datetime, timedelta

from app.config.schema import ScorecardConfig
from app.features.history import History


def rollover_share(h: History, t: datetime, sc: ScorecardConfig) -> float | None:
    """Share of the last N loans opened before, or within `reopen_hours` after, the previous loan was repaid.

    Counting "opened before repaying" as well keeps the factor monotone: repaying a loan sooner can never turn the
    next loan into a rollover.
    """
    f = sc.factors.f5_rollover
    loans = [loan for loan in h.loans if loan.disbursed_at <= t]
    if not loans:
        return None
    window = range(max(0, len(loans) - f.last_n), len(loans))
    rolled = 0
    for i in window:
        if i == 0:
            continue
        prev, cur = loans[i - 1], loans[i]
        repaid = prev.paid_in_full_at if prev.paid_by(t) else None
        if repaid is None or cur.disbursed_at <= repaid + timedelta(hours=f.reopen_hours):
            rolled += 1
    return rolled / len(window)


def open_loans(h: History, t: datetime) -> int:
    return sum(loan.is_open(t) for loan in h.loans)


def utilisation(h: History, t: datetime, sc: ScorecardConfig) -> tuple[float | None, bool]:
    """(average principal / limit over the last N loans with a known limit, every one of them above `over`?)."""
    f = sc.factors.f7_utilisation
    ratios = [loan.principal / loan.limit for loan in h.loans if loan.disbursed_at <= t and loan.limit][-f.last_n:]
    if not ratios:
        return None, False
    return sum(ratios) / len(ratios), len(ratios) == f.last_n and all(r > f.all_maxed.over for r in ratios)
