"""F11 credit hunger: limit-increase requests plus declined applications in the last 30 days."""

from datetime import datetime

from app.config.schema import ScorecardConfig
from app.features.common import in_window
from app.features.history import History


def credit_requests(h: History, t: datetime, sc: ScorecardConfig) -> int:
    window = sc.factors.f11_credit_hunger.window_days
    return sum(in_window(t, at, window) for at in (*h.limit_requests, *h.declines))
