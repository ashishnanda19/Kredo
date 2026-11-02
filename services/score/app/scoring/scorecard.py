"""Feature values → points per factor, each split across the reason codes it feeds. All numbers come from YAML."""

from dataclasses import dataclass, field
from typing import Any

from app.config.loader import EngineConfig
from app.config.schema import Bins

# Reason codes. Students see plain text for these (lib/copy-aura.ts); ops sees code and points.
ONTIME_STRONG = "ONTIME_STRONG"
EARLY_REPAY = "EARLY_REPAY"
TRACK_RECORD = "TRACK_RECORD"
ID_VERIFIED = "ID_VERIFIED"
LOW_UTILISATION = "LOW_UTILISATION"
THIN_FILE = "THIN_FILE"
LATE_RECENT = "LATE_RECENT"
OVERDUE_NOW = "OVERDUE_NOW"
PAYMENT_FAILURES = "PAYMENT_FAILURES"
ROLLOVER = "ROLLOVER"
STACKING = "STACKING"
HIGH_UTILISATION = "HIGH_UTILISATION"
CREDIT_HUNGER = "CREDIT_HUNGER"
SETTLED_OR_RESTRUCTURED = "SETTLED_OR_RESTRUCTURED"
# not in the original list. F4's "no failed payments" bonus needs its own code: ONTIME_STRONG would tell a student
# who paid late that they paid on time. F10 and F12 can move the score, so they need codes too.
CLEAN_PAYMENTS = "CLEAN_PAYMENTS"
PHONE_NEW = "PHONE_NEW"
BUREAU_POSITIVE = "BUREAU_POSITIVE"
BUREAU_NEGATIVE = "BUREAU_NEGATIVE"


@dataclass(frozen=True)
class FactorScore:
    factor: str
    points: int
    bin: str
    codes: dict[str, int] = field(default_factory=dict)

    def as_json(self) -> dict[str, Any]:
        return {"points": self.points, "bin": self.bin, "codes": self.codes}


def _signed(points: int, up: str, down: str) -> dict[str, int]:
    if points > 0:
        return {up: points}
    if points < 0:
        return {down: points}
    return {}


def _binned(name: str, bins: Bins, value: float | None, up: str, down: str, *, enabled: bool = True,
            positive_allowed: bool = True, why_zero: str = "no data") -> FactorScore:
    if value is None or not enabled:
        return FactorScore(name, 0, why_zero)
    b = bins.lookup(value)
    points = b.points if (b.points <= 0 or positive_allowed) else 0
    label = b.label if points == b.points else f"{b.label} (positive points wait for a closed loan)"
    return FactorScore(name, points, label, _signed(points, up, down))


def score_factors(fv: dict[str, Any], cfg: EngineConfig) -> list[FactorScore]:
    f = cfg.scorecard.factors
    thick = fv["matured_loans"] >= cfg.scorecard.thin_file_min_loans
    has_closed = fv["closed_loans"] >= 1  # "no history is not good history"
    out = [
        _binned("f1_ontime_rate", f.f1_ontime_rate.bins, fv["f1_ontime_rate"], ONTIME_STRONG, LATE_RECENT,
                enabled=thick, why_zero="thin file"),
        _binned("f2_worst_lateness", f.f2_worst_lateness.bins, fv["f2_worst_dpd"], ONTIME_STRONG, LATE_RECENT,
                positive_allowed=has_closed),
        _binned("f3_current_overdue", f.f3_current_overdue.bins, fv["f3_current_dpd"], ONTIME_STRONG, OVERDUE_NOW),
        _binned("f4_payment_failures", f.f4_payment_failures.bins, fv["f4_failure_weight"], CLEAN_PAYMENTS,
                PAYMENT_FAILURES, positive_allowed=has_closed),
        _binned("f5_rollover", f.f5_rollover.bins, fv["f5_rollover_share"], TRACK_RECORD, ROLLOVER, enabled=thick,
                why_zero="thin file"),
        _binned("f6_stacking", f.f6_stacking.bins, fv["f6_open_loans"], TRACK_RECORD, STACKING),
        _utilisation(fv, cfg, thick),
        _closures(fv, cfg),
        _track_record(fv, cfg, has_closed),
        _identity(fv, cfg),
        _binned("f11_credit_hunger", f.f11_credit_hunger.bins, fv["f11_credit_requests"], TRACK_RECORD,
                CREDIT_HUNGER),
        _bureau(fv, cfg),
    ]
    return out


def _utilisation(fv, cfg, thick: bool) -> FactorScore:
    f = cfg.scorecard.factors.f7_utilisation
    if not thick or fv["f7_utilisation"] is None:
        return FactorScore("f7_utilisation", 0, "thin file" if not thick else "no data")
    if fv["f7_all_maxed"]:
        p = f.all_maxed.points
        return FactorScore("f7_utilisation", p, f"all last {f.last_n} >{f.all_maxed.over:g}",
                           _signed(p, LOW_UTILISATION, HIGH_UTILISATION))
    return _binned("f7_utilisation", f.bins, fv["f7_utilisation"], LOW_UTILISATION, HIGH_UTILISATION)


def _closures(fv, cfg) -> FactorScore:
    f = cfg.scorecard.factors.f8_closure_quality
    codes = {
        TRACK_RECORD: min(fv["f8_clean_closures"] * f.clean_closure.points, f.clean_closure.cap),
        EARLY_REPAY: min(fv["f8_early_repayments"] * f.early_repayment.points, f.early_repayment.cap),
        SETTLED_OR_RESTRUCTURED: (f.restructured if fv["f8_restructured"] else 0)
        + (f.settled if fv["f8_settled"] else 0) + (f.written_off if fv["f8_written_off"] else 0),
    }
    codes = {k: v for k, v in codes.items() if v}
    parts = [f"{fv[k]} {k.removeprefix('f8_').replace('_', ' ')}" for k in
             ("f8_clean_closures", "f8_early_repayments", "f8_restructured", "f8_settled", "f8_written_off") if fv[k]]
    return FactorScore("f8_closure_quality", sum(codes.values()), ", ".join(parts) or "none", codes)


def _track_record(fv, cfg, has_closed: bool) -> FactorScore:
    f = cfg.scorecard.factors.f9_track_record
    b = f.bins.lookup(fv["f9_closed_weighted"])
    tenure = f.tenure.points if has_closed and fv["f9_months_on_kredo"] >= f.tenure.months else 0
    points = b.points + tenure
    label = b.label + (f" + {f.tenure.months}+ months" if tenure else "")
    return FactorScore("f9_track_record", points, label, _signed(points, TRACK_RECORD, TRACK_RECORD))


def _identity(fv, cfg) -> FactorScore:
    f = cfg.scorecard.factors.f10_identity
    full = fv["f10_kyc_level"] == "full" and fv["f10_college_verified"]
    age = fv["f10_phone_age_days"]
    new_phone = age is not None and age < f.new_phone.days
    codes = {ID_VERIFIED: f.full_verification if full else 0, PHONE_NEW: f.new_phone.points if new_phone else 0}
    codes = {k: v for k, v in codes.items() if v}
    label = ("full verification" if full else "partial verification") + (", new phone" if new_phone else "")
    return FactorScore("f10_identity", sum(codes.values()), label, codes)


def _bureau(fv, cfg) -> FactorScore:
    f = cfg.scorecard.factors.f12_bureau
    band = fv["f12_bureau"]
    if band is None:
        return FactorScore("f12_bureau", 0, "off")
    points = f.new_to_credit if band == "ntc" else f.bands.get(band, 0)
    return FactorScore("f12_bureau", points, band, _signed(points, BUREAU_POSITIVE, BUREAU_NEGATIVE))
