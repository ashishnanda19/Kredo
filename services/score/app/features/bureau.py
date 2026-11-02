"""F12 bureau band, optional. Used only when the policy enables it and the student's bureau-pull consent stands."""

from datetime import datetime

from app.config.schema import PolicyConfig
from app.domain.enums import ConsentPurpose
from app.features.history import History


def bureau(h: History, t: datetime, pol: PolicyConfig) -> str | None:
    """'ntc' (new to credit), a band letter, or None when unused."""
    if not pol.bureau.enabled or not h.consent_at(t, ConsentPurpose.BUREAU_PULL)[0]:
        return None
    latest = None
    for at, payload in h.bureau_reports:
        if at <= t:
            latest = payload
    if latest is None:
        return None
    return "ntc" if latest["ntc"] else latest["score_band"]
