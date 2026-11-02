"""score(events, as_of, config) → ScoreResult. Deterministic: no wall clock, no randomness, no I/O.

Velocity cap. KRS may rise at most `max_rise` in any rolling `window_days`. To keep that a pure function of the
events (and so replayable), the uncapped score is evaluated at the end of every India-time day since the user's
first event, and each day is capped against the lowest capped score of the previous `window_days` days:

    K(d) = min(raw(d), min(K(d-window) .. K(d-1)) + max_rise)

The score at `as_of` is the same step applied to raw(as_of). Falls are never capped. One factor sits outside the
cap: F3 (current overdue) is added after capping, so clearing an overdue amount helps right away, as the student
copy promises, instead of being throttled to 60 points a month. It can only lift a score back to where the rest of
the history puts it, so it cannot be farmed.

Consent. If scoring consent is withdrawn (or was never given) the score is frozen: it is evaluated at the moment
consent was withdrawn (or at the first event), and KO_CONSENT is added. Nothing is deleted.
"""

from collections import deque
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any
from uuid import UUID

from app.config.loader import EngineConfig
from app.domain.dpd import IST, ist_date
from app.domain.records import EventRecord
from app.features import compute_features
from app.features.history import History
from app.scoring.aura import aura_from_krs, streak, tier_for
from app.scoring.calibration import band_for, clamp_krs, implied_pd
from app.scoring.knockouts import knockouts, scoring_consent
from app.scoring.ladder import LadderState, next_step, run_ladder
from app.scoring.limits import recommend
from app.scoring.reasons import reason_codes
from app.scoring.scorecard import FactorScore, score_factors


@dataclass(frozen=True)
class ScoreResult:
    user_id: UUID
    as_of: datetime
    evaluated_at: datetime  # = as_of unless the score is frozen by consent
    krs: int
    raw_krs: int
    pd: float
    band: str
    band_action: str
    aura: int
    tier: str
    fresh_spawn: bool
    streak: int
    features: dict[str, Any]
    factors: list[FactorScore]
    reason_codes: list[dict]
    knockouts: list[str]
    ladder: LadderState
    limit_reco: dict[str, Any]
    daily: tuple["Day", ...]  # capped daily series up to the day before evaluated_at (for the Aura timeline)
    ladder_changes: tuple[tuple[datetime, int, int], ...]  # (at, from level, to level)
    input_event_ids: tuple[UUID, ...]
    scorecard_version: str
    policy_version: str
    config_hash: str

    def points_json(self, base_score: int) -> dict[str, Any]:
        """Base, points per factor, the clamp to 0..1000 and the velocity cap: reads as a waterfall to the final KRS."""
        return {
            "base": base_score,
            "factors": {f.factor: f.as_json() for f in self.factors},
            "raw_krs": self.raw_krs,
            "velocity_cap": self.krs - self.raw_krs,
        }


UNCAPPED_FACTOR = "f3_current_overdue"  # paying an overdue amount must help right away, so the cap skips it


@dataclass(frozen=True)
class Eval:
    raw: int  # clamped KRS before the velocity cap
    cappable: float  # base + every factor except F3, unclamped: the part the cap applies to
    overdue: int  # F3 points
    features: dict[str, Any]
    factors: list[FactorScore]


def evaluate(h: History, t: datetime, cfg: EngineConfig) -> Eval:
    features = compute_features(h, t, cfg)
    factors = score_factors(features, cfg)
    overdue = sum(f.points for f in factors if f.factor == UNCAPPED_FACTOR)
    cappable = cfg.scorecard.calibration.base_score + sum(f.points for f in factors) - overdue
    return Eval(clamp_krs(cappable + overdue, cfg.scorecard.calibration), cappable, overdue, features, factors)


def _end_of_day(d: date) -> datetime:
    return datetime.combine(d + timedelta(days=1), time(0), IST) - timedelta(microseconds=1)


@dataclass(frozen=True)
class Day:
    day: date
    raw: int
    krs: int  # after the cap
    capped_part: float  # the capped score before F3 is added back; this is what rises at most max_rise per window


def capped_series(h: History, until: datetime, cfg: EngineConfig) -> list[Day]:
    """Every full India-time day from the first event up to the day before `until`."""
    out: list[Day] = []
    window: deque[float] = deque(maxlen=cfg.scorecard.velocity_cap.window_days)
    d, last = ist_date(h.first_seen_at), ist_date(until)
    while d < last:
        out.append(_cap(evaluate(h, _end_of_day(d), cfg), window, cfg, d))
        window.append(out[-1].capped_part)
        d += timedelta(days=1)
    return out


def _cap(e: Eval, window, cfg: EngineConfig, d: date) -> Day:
    rise = cfg.scorecard.velocity_cap.max_rise
    part = min(e.cappable, min(window) + rise) if window else e.cappable
    return Day(d, e.raw, clamp_krs(part + e.overdue, cfg.scorecard.calibration), part)


def score(events: Sequence[EventRecord], as_of: datetime, cfg: EngineConfig) -> ScoreResult:
    if as_of.tzinfo is None:
        raise ValueError("as_of must be timezone-aware")
    known = [e for e in events if e.occurred_at <= as_of]
    h = History.build(known)

    consent_ok, changed_at = scoring_consent(h, as_of)
    evaluated_at = as_of if consent_ok else (changed_at or h.first_seen_at)
    if evaluated_at != as_of:
        h = History.build([e for e in known if e.occurred_at <= evaluated_at])

    sc, pol = cfg.scorecard, cfg.policy
    series = capped_series(h, evaluated_at, cfg)
    index = {x.day: i for i, x in enumerate(series)}

    def krs_at(t: datetime) -> int:
        """The capped KRS at any moment up to `evaluated_at`, from the same daily series."""
        i = index.get(ist_date(t), len(series))
        window = [x.capped_part for x in series[max(0, i - sc.velocity_cap.window_days):i]]
        return _cap(evaluate(h, t, cfg), window, cfg, ist_date(t)).krs

    now = evaluate(h, evaluated_at, cfg)
    krs = krs_at(evaluated_at)
    raw, features, factors = now.raw, now.features, now.factors

    band = band_for(krs, pol)
    aura = aura_from_krs(krs)
    thin = features["matured_loans"] < sc.thin_file_min_loans
    fresh_spawn = features["closed_loans"] < 2  # display badge: "two on-time repayments and your Aura starts moving"
    kos = knockouts(h, evaluated_at, pol, consent_ok=consent_ok)
    changes: list[tuple[datetime, int, int]] = []
    ladder = run_ladder(h, evaluated_at, pol, lambda t: band_for(krs_at(t), pol).band,
                        {x.day: band_for(x.krs, pol).band for x in series}, changes)
    nxt = next_step(h, ladder, evaluated_at, band.band, pol)
    return ScoreResult(
        user_id=h.user_id,
        as_of=as_of,
        evaluated_at=evaluated_at,
        krs=krs,
        raw_krs=raw,
        pd=implied_pd(krs, sc.calibration),
        band=band.band,
        band_action=band.action,
        aura=aura,
        tier=tier_for(band.band, aura, h, evaluated_at, pol),
        fresh_spawn=fresh_spawn,
        streak=streak(h, evaluated_at, pol),
        features=features,
        factors=factors,
        reason_codes=reason_codes(factors, thin_file=thin),
        knockouts=kos,
        ladder=ladder,
        limit_reco=recommend(h, evaluated_at, ladder, nxt, band, kos, pol),
        daily=tuple(series),
        ladder_changes=tuple(changes),
        input_event_ids=h.event_ids,
        scorecard_version=sc.version,
        policy_version=pol.version,
        config_hash=cfg.hash,
    )
