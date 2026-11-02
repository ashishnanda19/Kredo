"""The limit ladder: a pure fold over the user's history, like everything else in scoring.

Steps are processed in time order: verification, disbursal, a loan reaching the demotion or freeze DPD, a loan
repaid in full, and the end of every India-time day. Promotion is checked at verification, after each repayment,
and at each day's end; never at `as_of` itself. So the ladder at a later time always continues the ladder at an
earlier one, and two snapshots never disagree about the past.

The engine only recommends. The lending partner's own decision is recorded separately and always wins.
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from uuid import UUID

from app.config.schema import PolicyConfig, band_meets
from app.domain.dpd import IST, ist_date
from app.domain.enums import KycLevel
from app.features.failures import loan_failed_before
from app.features.history import History, LoanFacts
from app.features.track_record import months_on_kredo

BandAt = Callable[[datetime], str]


@dataclass
class LadderState:
    level: int = 0  # 0: no limit yet
    cycles_at_level: int = 0
    last_step_up_at: datetime | None = None
    freezing_loans: set[UUID] = field(default_factory=set)
    cured_at: datetime | None = None
    cycles_since_cure: int = 0
    clean_cycles_total: int = 0
    demotions: int = 0

    @property
    def frozen(self) -> bool:
        return bool(self.freezing_loans) or self.cured_at is not None


def _start_of(d: date) -> datetime:
    return datetime.combine(d, time(0), IST)


def _end_of(d: date) -> datetime:
    return _start_of(d + timedelta(days=1)) - timedelta(microseconds=1)


def is_clean_cycle(h: History, loan: LoanFacts, limit_at: int | None, pol: PolicyConfig) -> bool:
    cc, r = pol.ladder.clean_cycle, pol.repayment
    paid = loan.paid_in_full_at
    return (
        paid is not None
        and bool(limit_at)
        and loan.principal >= cc.min_utilisation * limit_at
        and paid - loan.disbursed_at >= timedelta(days=cc.min_days_open)
        and loan.on_time_by(paid, r.grace_days, r.early_days)
        and not loan_failed_before(h, loan, paid, pol)
    )


def run_ladder(h: History, as_of: datetime, pol: PolicyConfig, band_at: BandAt,
               day_band: dict[date, str], changes: list[tuple[datetime, int, int]] | None = None) -> LadderState:
    """`changes`, when given, collects every level change as (at, from, to), for the Aura timeline."""
    lad = pol.ladder
    steps: list[tuple[datetime, int, str, object]] = [(at, 0, "verify", None) for at, _ in h.verified]
    for loan in h.loans:
        steps.append((loan.disbursed_at, 1, "disburse", loan))
        for dpd, kind in ((lad.demote_at_dpd, "demote"), (lad.freeze_at_dpd, "freeze")):
            at = _start_of(loan.due_date + timedelta(days=dpd))
            if at <= as_of and loan.dpd(at) >= dpd:
                steps.append((at, 2, kind, loan))
        if loan.paid_by(as_of):
            steps.append((loan.paid_in_full_at, 3, "paid", loan))
    d = ist_date(h.first_seen_at)
    while d < ist_date(as_of):
        steps.append((_end_of(d), 9, "day", d))
        d += timedelta(days=1)
    steps = [s for s in steps if s[0] <= as_of]
    steps.sort(key=lambda s: (s[0], s[1], str(getattr(s[3], "loan_id", ""))))

    st = LadderState()
    limit_at: dict[UUID, int | None] = {}

    def amount() -> int | None:
        return lad.levels[st.level - 1].limit_paise if st.level else None

    def try_promote(t: datetime, band: str) -> None:
        if st.level == 0:
            if h.kyc_level(t) != KycLevel.NONE and band_meets(band, lad.levels[0].min_band):
                st.level = 1
            return
        if st.frozen or st.level >= len(lad.levels):
            return
        nxt = lad.levels[st.level]
        waited = st.last_step_up_at is None or t - st.last_step_up_at >= timedelta(days=lad.step_up_min_days)
        if (st.cycles_at_level >= nxt.cycles and band_meets(band, nxt.min_band)
                and months_on_kredo(h, t) >= nxt.min_months and waited):
            st.level += 1
            st.cycles_at_level = 0
            st.last_step_up_at = t

    for t, _, kind, x in steps:
        before = st.level
        match kind:
            case "verify":
                try_promote(t, band_at(t))
            case "disburse":
                limit_at[x.loan_id] = x.limit or amount()
            case "demote":
                if st.level:
                    st.level = max(1, st.level - 1)
                    st.cycles_at_level = 0
                    st.demotions += 1
            case "freeze":
                st.freezing_loans.add(x.loan_id)
            case "paid":
                if x.loan_id in st.freezing_loans:
                    st.freezing_loans.discard(x.loan_id)
                    st.cured_at, st.cycles_since_cure = t, 0
                elif is_clean_cycle(h, x, limit_at.get(x.loan_id), pol):
                    st.cycles_at_level += 1
                    st.clean_cycles_total += 1
                    if st.cured_at is not None and not st.freezing_loans:
                        st.cycles_since_cure += 1
                        if st.cycles_since_cure >= lad.unfreeze_clean_cycles:
                            st.cured_at = None
                try_promote(t, band_at(t))
            case "day":
                try_promote(t, day_band[x])
        if changes is not None and st.level != before:
            changes.append((t, before, st.level))
    return st


def next_step(h: History, st: LadderState, t: datetime, band: str, pol: PolicyConfig) -> dict | None:
    """What stands between the student and the next level, for 'N more clean cycles to ₹3,000'."""
    lad = pol.ladder
    if st.level >= len(lad.levels):
        return None
    nxt = lad.levels[st.level]
    blockers = []
    if st.level == 0:
        if h.kyc_level(t) == KycLevel.NONE:
            blockers.append("verification")
        if not band_meets(band, nxt.min_band):
            blockers.append("band")
        return {"level": nxt.level, "amount_paise": nxt.limit_paise, "cycles_needed": 0, "blockers": blockers}
    if st.frozen:
        blockers.append("frozen")
    if not band_meets(band, nxt.min_band):
        blockers.append("band")
    if months_on_kredo(h, t) < nxt.min_months:
        blockers.append("months_on_kredo")
    if st.last_step_up_at and t - st.last_step_up_at < timedelta(days=lad.step_up_min_days):
        blockers.append("step_up_wait")
    return {"level": nxt.level, "amount_paise": nxt.limit_paise,
            "cycles_needed": max(0, nxt.cycles - st.cycles_at_level), "blockers": blockers}
