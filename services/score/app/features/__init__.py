"""Feature values: pure functions of (history, as_of, config). History is built from events alone, so every feature is
ultimately f(events, as_of). No wall clock, no randomness, no database.

`FEATURE_NAMES` is the full list of scoring inputs; a test fails if a protected or proxy attribute appears in it.
"""

from datetime import datetime
from typing import Any

from app.config.loader import EngineConfig
from app.features import (
    borrowing,
    bureau,
    closures,
    failures,
    hunger,
    identity,
    repayment,
    track_record,
)
from app.features.history import History

FEATURE_NAMES = (
    "closed_loans",
    "matured_loans",
    "f1_ontime_rate",
    "f2_worst_dpd",
    "f3_current_dpd",
    "f4_failure_weight",
    "f5_rollover_share",
    "f6_open_loans",
    "f7_utilisation",
    "f7_all_maxed",
    "f8_clean_closures",
    "f8_early_repayments",
    "f8_restructured",
    "f8_settled",
    "f8_written_off",
    "f9_closed_weighted",
    "f9_months_on_kredo",
    "f10_kyc_level",
    "f10_college_verified",
    "f10_phone_age_days",
    "f11_credit_requests",
    "f12_bureau",
)


def _r(x: float | None) -> float | None:
    """Rounded so JSON round-trips exactly and float noise never flips a bin on replay."""
    return None if x is None else round(x, 6)


def compute_features(h: History, t: datetime, cfg: EngineConfig) -> dict[str, Any]:
    sc, pol = cfg.scorecard, cfg.policy
    utilisation, all_maxed = borrowing.utilisation(h, t, sc)
    clos = closures.closure_quality(h, t, sc, pol)
    out = {
        "closed_loans": track_record.closed_count(h, t),
        "matured_loans": track_record.matured_count(h, t),
        "f1_ontime_rate": _r(repayment.ontime_rate(h, t, sc, pol)),
        "f2_worst_dpd": repayment.worst_lateness(h, t, sc, pol),
        "f3_current_dpd": repayment.current_overdue(h, t, pol),
        "f4_failure_weight": _r(failures.failure_weight(h, t, sc, pol)),
        "f5_rollover_share": _r(borrowing.rollover_share(h, t, sc)),
        "f6_open_loans": borrowing.open_loans(h, t),
        "f7_utilisation": _r(utilisation),
        "f7_all_maxed": all_maxed,
        **clos,
        "f9_closed_weighted": _r(track_record.closed_weighted(h, t, sc)),
        "f9_months_on_kredo": track_record.months_on_kredo(h, t),
        **identity.identity(h, t),
        "f11_credit_requests": hunger.credit_requests(h, t, sc),
        "f12_bureau": bureau.bureau(h, t, pol),
    }
    assert tuple(out) == FEATURE_NAMES, "feature list drifted from FEATURE_NAMES"
    return out
