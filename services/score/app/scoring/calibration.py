"""KRS ↔ odds ↔ PD, and KRS → band. v1 points and a future trained model share these units."""

from app.config.schema import BandRule, Calibration, PolicyConfig


def clamp_krs(raw: float, c: Calibration) -> int:
    return int(max(c.min_score, min(c.max_score, raw)))


def implied_pd(krs: int, c: Calibration) -> float:
    odds = c.base_odds * 2 ** ((krs - c.base_score) / c.pdo)
    return 1 / (1 + odds)


def band_for(krs: int, policy: PolicyConfig) -> BandRule:
    return next(b for b in policy.bands if krs >= b.min_krs)
