from datetime import datetime, timedelta


def age_days(t: datetime, at: datetime) -> float:
    return max(0.0, (t - at).total_seconds() / 86400)


def recency_weight(t: datetime, at: datetime, half_life_days: float) -> float:
    """An event counts half after one half-life: w = 0.5 ^ (age_days / half_life)."""
    return 0.5 ** (age_days(t, at) / half_life_days)


def in_window(t: datetime, at: datetime, days: int) -> bool:
    return t - timedelta(days=days) <= at <= t
