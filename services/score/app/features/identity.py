"""F10 identity strength: KYC level, whether college ID and college email are verified, and phone-number age.
Which college a student attends is never read.
"""

from datetime import date, datetime

from app.domain.dpd import ist_date
from app.features.history import History


def identity(h: History, t: datetime) -> dict:
    latest = None
    for at, payload in h.verified:
        if at <= t:
            latest = payload
    if latest is None:
        return {"f10_kyc_level": "none", "f10_college_verified": False, "f10_phone_age_days": None}
    phone = latest.get("phone_first_seen_at")
    return {
        "f10_kyc_level": latest["kyc_level"],
        "f10_college_verified": bool(latest["college_id_verified"] and latest["college_email_verified"]),
        "f10_phone_age_days": (ist_date(t) - date.fromisoformat(phone)).days if phone else None,
    }
