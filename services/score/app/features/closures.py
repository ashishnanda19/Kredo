"""F8 closure quality. Clean and early closures earn points; settlement, restructuring and write-off cost them.
Early repayment and full closure are never penalised.
"""

from datetime import datetime

from app.config.schema import PolicyConfig, ScorecardConfig
from app.domain.enums import ClosureType, LoanState
from app.features.common import in_window
from app.features.history import History


def closure_quality(h: History, t: datetime, sc: ScorecardConfig, pol: PolicyConfig) -> dict[str, int]:
    window = sc.factors.f8_closure_quality.window_days
    out = {"f8_clean_closures": 0, "f8_early_repayments": 0, "f8_restructured": 0, "f8_settled": 0,
           "f8_written_off": 0}
    for loan in h.loans:
        fin = loan.finished_at(t)
        if fin is None or not in_window(t, fin, window):
            continue
        if loan.negative_by(t):
            out[{ClosureType.RESTRUCTURED: "f8_restructured", ClosureType.SETTLED: "f8_settled",
                 ClosureType.WRITTEN_OFF: "f8_written_off"}[loan.closure_type]] += 1
        elif loan.clean_by(t):
            out["f8_clean_closures"] += 1
            if loan.timing(pol.repayment.grace_days, pol.repayment.early_days) == LoanState.PAID_EARLY:
                out["f8_early_repayments"] += 1
    return out
