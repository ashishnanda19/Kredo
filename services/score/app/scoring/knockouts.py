"""Knockouts override the score and pause new loans. Each has a calm, plain message and a way out.

Student-facing wording lives in lib/copy-aura.ts; the text here is for ops and the API.
"""

from datetime import datetime, time, timedelta

from app.config.schema import PolicyConfig
from app.domain.dpd import IST
from app.domain.enums import ClosureType, ConsentPurpose, KycLevel
from app.features.history import History

KNOCKOUTS: dict[str, tuple[str, str]] = {
    "KO_OVERDUE_30": ("A loan is more than 30 days overdue.", "Clear the overdue amount."),
    "KO_DPD90_12M": ("A loan reached 90 or more days overdue in the last 12 months.",
                     "Lifts automatically after 12 clean months, or on review by the lending partner."),
    "KO_WRITTEN_OFF": ("A past loan was written off.", "Review by the lending partner only."),
    "KO_FRAUD": ("The account is on hold after a confirmed fraud check.", "Resolved by the ops team (maker-checker)."),
    "KO_KYC": ("Identity checks are not complete.", "Complete KYC."),
    "KO_DUPLICATE": ("These details are linked to another active account.", "Resolved by the ops team."),
    "KO_CONSENT": ("Consent for scoring was withdrawn or not given. The score is frozen, not deleted.",
                   "Grant consent for scoring again."),
}


def knockouts(h: History, t: datetime, policy: PolicyConfig, *, consent_ok: bool) -> list[str]:
    k = policy.knockouts
    out = []
    if any(loan.is_open(t) and loan.dpd(t) >= k.overdue_min_dpd for loan in h.loans):
        out.append("KO_OVERDUE_30")
    lookback = t - timedelta(days=k.dpd90_lookback_days)
    for loan in h.loans:
        reached = datetime.combine(loan.due_date + timedelta(days=k.dpd90_min_dpd), time(0), IST)
        if loan.dpd(t) >= k.dpd90_min_dpd and reached >= lookback:
            out.append("KO_DPD90_12M")
            break
    if any(loan.closed_by(t) and loan.closure_type == ClosureType.WRITTEN_OFF for loan in h.loans):
        out.append("KO_WRITTEN_OFF")
    flags = h.active_flags(t)
    if flags & set(k.fraud_flag_types):
        out.append("KO_FRAUD")
    if h.kyc_level(t) == KycLevel.NONE:
        out.append("KO_KYC")
    if flags & set(k.duplicate_flag_types):
        out.append("KO_DUPLICATE")
    if not consent_ok:
        out.append("KO_CONSENT")
    return out


def scoring_consent(h: History, t: datetime) -> tuple[bool, datetime | None]:
    return h.consent_at(t, ConsentPurpose.SCORING)
