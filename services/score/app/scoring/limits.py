"""The limit recommendation: ladder level, band policy, knockouts and approved overrides, combined.

Overrides adjust the recommendation only; KRS, band and Aura are never overridden.
"""

from datetime import datetime

from app.config.schema import BandRule, PolicyConfig
from app.domain.enums import OverrideField
from app.features.history import History
from app.scoring.ladder import LadderState

ELIGIBLE_ACTIONS = ("eligible_step_up", "eligible_hold")


def open_loans(h: History, t: datetime) -> list[dict]:
    """What the student still owes, loan by loan: for the knockout card and the what-if slider."""
    return [{"loan_id": str(loan.loan_id), "due_date": loan.due_date.isoformat(),
             "outstanding_paise": max(0, loan.owed - sum(a for at, a in loan.credits if at <= t)), "dpd": loan.dpd(t)}
            for loan in h.loans if loan.is_open(t)]


def outstanding(h: History, t: datetime) -> int:
    return sum(x["outstanding_paise"] for x in open_loans(h, t))


def recommend(h: History, t: datetime, st: LadderState, nxt: dict | None, band: BandRule, knockouts: list[str],
              pol: PolicyConfig) -> dict:
    levels = pol.ladder.levels
    overrides = h.active_overrides(t)
    level = st.level
    if (o := overrides.get(OverrideField.LADDER_LEVEL)) is not None:
        level = min(o.value, len(levels))
    amount = levels[level - 1].limit_paise if level else 0
    if (o := overrides.get(OverrideField.LIMIT_CAP_PAISE)) is not None:
        amount = min(amount, o.value)
    paused = OverrideField.PAUSE_NEW_LOANS in overrides
    held = pol.fraud.hold_flag in h.active_flags(t)  # a fraud alert awaits ops review

    eligible = (bool(level) and amount > 0 and not knockouts and not paused and not held
                and band.action in ELIGIBLE_ACTIONS)
    owed = outstanding(h, t)
    return {
        "level": f"L{level}" if level else None,
        "amount_paise": amount,
        "eligible": eligible,
        "action": "held_for_review" if held else "paused_by_override" if paused else band.action,
        "held_for_review": held,
        "manual_review": band.action == "manual_review",
        "outstanding_paise": owed,
        "max_ticket_paise": max(0, amount - owed) if eligible else 0,
        "cycles_at_level": st.cycles_at_level,
        "frozen": st.frozen,
        "next": nxt,
        "next_level_in_cycles": nxt["cycles_needed"] if nxt else None,
        "open_loans": open_loans(h, t),
        "overrides": [{"override_id": str(o.override_id), "field": f, "value": o.value,
                       "expires_at": o.expires_at.isoformat()} for f, o in sorted(overrides.items())],
    }
