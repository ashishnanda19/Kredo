"""Aura: the student-facing view of KRS. A straight-line translation, never separate maths.

Aura = clamp(floor((KRS - 400) / 4), 0, 100). Rounding down keeps Aura 30, 50 and 70 exactly on the C, B and A band
edges (KRS 520, 600, 680), so a tier never disagrees with the band. Tiers come from the band itself.
"""

from datetime import datetime, timedelta

from app.config.schema import TIER_ORDER, PolicyConfig, Tier
from app.domain.enums import ClosureType
from app.features.history import History

BAND_TIER: dict[str, Tier] = {"A": "main_character", "B": "locked_in", "C": "side_quest", "D": "reset_arc",
                              "E": "reset_arc"}


def aura_from_krs(krs: int) -> int:
    return max(0, min(100, (krs - 400) // 4))


def tier_for(band: str, aura: int, h: History, t: datetime, policy: PolicyConfig) -> Tier:
    tier = BAND_TIER[band]
    if band == "A" and aura >= policy.aura.top_tier_min_aura:
        tier = "aura_farmer"
    cap = policy.aura.settled_tier_cap
    since = t - timedelta(days=round(cap.months * 30.44))
    if any(loan.closure_type == ClosureType.SETTLED and loan.closed_by(t) and loan.closed_at >= since
           for loan in h.loans):
        tier = min(tier, cap.tier, key=TIER_ORDER.index)
    return tier


def streak(h: History, t: datetime, policy: PolicyConfig) -> int:
    """Consecutive most recent finished loans paid on time. Display only; resets quietly on a late one."""
    r = policy.repayment
    finished = sorted((loan for loan in h.loans if loan.finished_at(t) is not None), key=lambda x: x.finished_at(t))
    count = 0
    for loan in reversed(finished):
        if not loan.on_time_by(t, r.grace_days, r.early_days):
            break
        count += 1
    return count
