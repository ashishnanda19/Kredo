"""Validates the scorecard and policy YAML at boot. A config that breaks a safety rail does not load.

Safety rails checked here: bins are ordered and end in `else`; every factor's points move in its allowed direction
(monotonicity); the bureau factor stays within -60..+40; bands run A to E from highest to lowest.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, RootModel, model_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)


class Bin(Strict):
    lt: float | None = None
    le: float | None = None
    otherwise: bool = Field(False, alias="else")
    points: int

    @model_validator(mode="after")
    def _one_condition(self):
        if sum([self.lt is not None, self.le is not None, self.otherwise]) != 1:
            raise ValueError("a bin needs exactly one of lt, le or else")
        return self

    @property
    def bound(self) -> float:
        return float("inf") if self.otherwise else (self.lt if self.lt is not None else self.le)

    def matches(self, value: float) -> bool:
        if self.otherwise:
            return True
        return value < self.lt if self.lt is not None else value <= self.le

    @property
    def label(self) -> str:
        return "else" if self.otherwise else (f"<{self.lt:g}" if self.lt is not None else f"<={self.le:g}")


class Bins(RootModel[tuple[Bin, ...]]):
    @model_validator(mode="after")
    def _ordered(self):
        bins = self.root
        if not bins or not bins[-1].otherwise or any(b.otherwise for b in bins[:-1]):
            raise ValueError("bins must end with exactly one `else` bin")
        bounds = [b.bound for b in bins]
        if bounds != sorted(bounds):
            raise ValueError("bins must be in ascending order")
        return self

    def lookup(self, value: float) -> Bin:
        return next(b for b in self.root if b.matches(value))

    def points(self) -> list[int]:
        return [b.points for b in self.root]


class Calibration(Strict):
    base_score: int
    base_odds: float = Field(gt=0)
    pdo: float = Field(gt=0)
    min_score: int
    max_score: int


class QuickRepay(Strict):
    days: int = Field(ge=0)
    weight: float = Field(gt=0, le=1)


class VelocityCap(Strict):
    max_rise: int = Field(gt=0)
    window_days: int = Field(gt=0)


class Capped(Strict):
    points: int = Field(ge=0)
    cap: int = Field(ge=0)


class WindowBins(Strict):
    window_days: int = Field(gt=0)
    bins: Bins


class PlainBins(Strict):
    bins: Bins


class Rollover(Strict):
    last_n: int = Field(gt=0)
    reopen_hours: int = Field(ge=0)
    bins: Bins


class AllMaxed(Strict):
    over: float = Field(gt=0, le=1)
    points: int


class Utilisation(Strict):
    last_n: int = Field(gt=0)
    bins: Bins
    all_maxed: AllMaxed


class ClosureQuality(Strict):
    window_days: int = Field(gt=0)
    clean_closure: Capped
    early_repayment: Capped
    restructured: int = Field(le=0)
    settled: int = Field(le=0)
    written_off: int = Field(le=0)


class Tenure(Strict):
    months: int = Field(gt=0)
    points: int = Field(ge=0)


class TrackRecord(Strict):
    bins: Bins
    tenure: Tenure


class NewPhone(Strict):
    days: int = Field(gt=0)
    points: int = Field(le=0)


class Identity(Strict):
    full_verification: int = Field(ge=0)
    new_phone: NewPhone


class BureauPoints(Strict):
    new_to_credit: int = Field(ge=-60, le=40)
    bands: dict[str, int]

    @model_validator(mode="after")
    def _range(self):
        if any(not -60 <= p <= 40 for p in self.bands.values()):
            raise ValueError("bureau points must stay within -60..+40")
        return self


class Factors(Strict):
    f1_ontime_rate: WindowBins
    f2_worst_lateness: WindowBins
    f3_current_overdue: PlainBins
    f4_payment_failures: WindowBins
    f5_rollover: Rollover
    f6_stacking: PlainBins
    f7_utilisation: Utilisation
    f8_closure_quality: ClosureQuality
    f9_track_record: TrackRecord
    f10_identity: Identity
    f11_credit_hunger: WindowBins
    f12_bureau: BureauPoints


def _monotone(points: list[int], higher_is_better: bool) -> bool:
    pairs = list(zip(points, points[1:], strict=False))
    return all(a <= b for a, b in pairs) if higher_is_better else all(a >= b for a, b in pairs)


# The direction each factor's value may move KRS. Fixed in code on purpose: YAML can tune points, not flip a rail.
HIGHER_IS_BETTER = {"f1_ontime_rate": True, "f9_track_record": True}
HIGHER_IS_WORSE = ("f2_worst_lateness", "f3_current_overdue", "f4_payment_failures", "f5_rollover", "f6_stacking",
                   "f7_utilisation", "f11_credit_hunger")


class ScorecardConfig(Strict):
    version: str
    feature_set_version: str
    calibration: Calibration
    recency_half_life_days: float = Field(gt=0)
    thin_file_min_loans: int = Field(ge=0)
    quick_repay: QuickRepay
    velocity_cap: VelocityCap
    factors: Factors

    @model_validator(mode="after")
    def _monotonicity(self):
        f = self.factors
        for name in HIGHER_IS_BETTER:
            if not _monotone(getattr(f, name).bins.points(), True):
                raise ValueError(f"{name}: points must not fall as the value improves")
        for name in HIGHER_IS_WORSE:
            if not _monotone(getattr(f, name).bins.points(), False):
                raise ValueError(f"{name}: points must not rise as the value worsens")
        if f.f7_utilisation.all_maxed.points > f.f7_utilisation.bins.points()[-1]:
            raise ValueError("f7_utilisation: all_maxed must score no better than the top utilisation bin")
        return self


BandName = Literal["A", "B", "C", "D", "E"]
BandAction = Literal["eligible_step_up", "eligible_hold", "manual_review", "paused"]
Tier = Literal["reset_arc", "side_quest", "locked_in", "main_character", "aura_farmer"]
TIER_ORDER: tuple[Tier, ...] = ("reset_arc", "side_quest", "locked_in", "main_character", "aura_farmer")


class Repayment(Strict):
    grace_days: int = Field(ge=0)
    early_days: int = Field(ge=1)
    min_due_fraction: float = Field(gt=0, le=1)


class BandRule(Strict):
    band: BandName
    min_krs: int
    action: BandAction


class Knockouts(Strict):
    overdue_min_dpd: int = Field(gt=0)
    dpd90_min_dpd: int = Field(gt=0)
    dpd90_lookback_days: int = Field(gt=0)
    fraud_flag_types: tuple[str, ...]
    duplicate_flag_types: tuple[str, ...]


class TierCap(Strict):
    tier: Tier
    months: int = Field(gt=0)


class AuraPolicy(Strict):
    top_tier_min_aura: int = Field(ge=0, le=100)
    settled_tier_cap: TierCap


class BureauPolicy(Strict):
    enabled: bool


BAND_RANK = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}


def band_meets(band: str, minimum: str) -> bool:
    return BAND_RANK[band] <= BAND_RANK[minimum]


class LadderLevel(Strict):
    level: str = Field(pattern=r"^L[1-9]$")
    limit_paise: int = Field(gt=0)
    min_band: BandName
    cycles: int = Field(0, ge=0)
    min_months: int = Field(0, ge=0)


class CleanCycle(Strict):
    min_utilisation: float = Field(gt=0, le=1)
    min_days_open: int = Field(ge=0)


class Ladder(Strict):
    levels: tuple[LadderLevel, ...]
    clean_cycle: CleanCycle
    step_up_min_days: int = Field(ge=0)
    demote_at_dpd: int = Field(gt=0)
    freeze_at_dpd: int = Field(gt=0)
    unfreeze_clean_cycles: int = Field(ge=0)

    @model_validator(mode="after")
    def _ordered(self):
        lv = self.levels
        if [x.level for x in lv] != [f"L{i + 1}" for i in range(len(lv))] or not lv:
            raise ValueError("ladder levels must be L1, L2, ... in order")
        if any(b.limit_paise <= a.limit_paise for a, b in zip(lv, lv[1:], strict=False)):
            raise ValueError("ladder limits must rise level by level")
        if any(not band_meets(b.min_band, a.min_band) for a, b in zip(lv, lv[1:], strict=False)):
            raise ValueError("a higher level cannot accept a worse band than the level below")
        if self.freeze_at_dpd < self.demote_at_dpd:
            raise ValueError("freeze_at_dpd must be at least demote_at_dpd")
        return self


Severity = Literal["low", "medium", "high"]


class FraudRule(Strict):
    severity: Severity
    # the flag a confirmed alert sets on the student; it must be a knockout flag. None: confirming records the
    # finding but never pauses lending (farming and rollover are handled by the scorecard and by support).
    confirm_flag: str | None = Field(None, pattern=r"^[A-Z0-9_]+$")


class Farming(FraudRule):
    quick_days: int = Field(gt=0)  # repaid within this many days of disbursal
    window_days: int = Field(gt=0)
    min_loans: int = Field(gt=1)  # "more than 4" is min_loans: 5


class SameAmount(Strict):
    min_spends: int = Field(gt=1)
    window_days: int = Field(gt=0)
    tolerance: float = Field(ge=0, lt=0.5)  # relative to the first spend


class NearLimit(Strict):
    fraction: float = Field(gt=0, le=1)  # spend ≥ this share of what was still available on the loan
    min_spends: int = Field(gt=0)


class Collusion(FraudRule):
    same_amount: SameAmount
    near_limit: NearLimit
    refund_within_hours: int = Field(gt=0)


class VendorAnomaly(FraudRule):
    share: float = Field(gt=0, le=1)  # one vendor's share of a student's spend...
    cycles: int = Field(gt=0)  # ...over this many consecutive loans with spends
    surge_ratio: float = Field(gt=1)  # vendor's Kredo volume this IST week ÷ last week
    surge_min_week_paise: int = Field(ge=0)  # ignore weeks below this volume


class Velocity(FraudRule):
    max_spends: int = Field(gt=0)  # more than this many...
    window_minutes: int = Field(gt=0)  # ...in this many minutes
    max_campuses_per_day: int = Field(gt=0)  # more campuses than this in one IST day
    hold: bool  # hold further spends until ops review


class Ring(FraudRule):
    kinds: tuple[Literal["device", "payout_account", "phone"], ...]


class RolloverChain(FraudRule):
    min_loans: int = Field(gt=1)
    within_hours: int = Field(gt=0)


class FraudPolicy(Strict):
    hold_flag: str = Field(pattern=r"^[A-Z0-9_]+$")  # set while a holding alert awaits review; pauses new loans
    farming: Farming
    collusion: Collusion
    vendor_anomaly: VendorAnomaly
    velocity: Velocity
    ring: Ring
    rollover: RolloverChain

    def rule(self, name: str) -> FraudRule:
        return {"FARMING": self.farming, "COLLUSION": self.collusion, "VENDOR_ANOMALY": self.vendor_anomaly,
                "VELOCITY": self.velocity, "RING": self.ring, "ROLLOVER": self.rollover}[name]


class LabelPolicy(Strict):
    version: int = Field(ge=1)
    window_days: int = Field(gt=0)
    bad_dpd: int = Field(gt=0)


class Psi(Strict):
    bin_width: int = Field(gt=0, le=500)
    alert_above: float = Field(gt=0)
    min_users: int = Field(gt=0)  # PSI on a handful of students is noise: below this a month has no PSI and no alert


class Calibration(Strict):
    min_loans_per_band: int = Field(gt=0)


class Fairness(Strict):
    min_cell: int = Field(gt=1)
    flag_below: float = Field(gt=0, lt=1)


class V2Targets(Strict):
    target_loans: int = Field(gt=0)
    target_bad: int = Field(gt=0)


class MonitoringPolicy(Strict):
    label: LabelPolicy
    psi: Psi
    calibration: Calibration
    fairness: Fairness
    v2: V2Targets


class PolicyConfig(Strict):
    version: str
    repayment: Repayment
    bands: tuple[BandRule, ...]
    knockouts: Knockouts
    aura: AuraPolicy
    bureau: BureauPolicy
    ladder: Ladder
    fraud: FraudPolicy
    monitoring: MonitoringPolicy

    @model_validator(mode="after")
    def _bands(self):
        if [b.band for b in self.bands] != ["A", "B", "C", "D", "E"]:
            raise ValueError("bands must be listed A to E")
        mins = [b.min_krs for b in self.bands]
        if mins != sorted(mins, reverse=True) or len(set(mins)) != len(mins) or mins[-1] != 0:
            raise ValueError("band minimums must strictly fall from A to E, and E must start at 0")
        return self

    @model_validator(mode="after")
    def _fraud_flags(self):
        ko_flags = set(self.knockouts.fraud_flag_types) | set(self.knockouts.duplicate_flag_types)
        f = self.fraud
        for name in ("FARMING", "COLLUSION", "VENDOR_ANOMALY", "VELOCITY", "RING", "ROLLOVER"):
            flag = f.rule(name).confirm_flag
            if flag is not None and flag not in ko_flags:
                raise ValueError(f"{name}.confirm_flag must be one of the knockout flag types")
        if f.hold_flag in ko_flags:
            raise ValueError("the hold flag pauses lending without a knockout, so it cannot be a knockout flag")
        return self
