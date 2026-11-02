"""Closed vocabularies shared by events, the database and (later) scoring. Values are stored as text."""

from enum import StrEnum


class Source(StrEnum):
    NBFC = "nbfc"
    DEMO_CONTROLS = "demo_controls"
    SIMULATOR = "simulator"
    OPS = "ops"


class EventType(StrEnum):
    USER_VERIFIED = "user_verified"
    LOAN_APPLIED = "loan_applied"
    LOAN_DECIDED = "loan_decided"
    LOAN_DISBURSED = "loan_disbursed"
    SPEND_MADE = "spend_made"
    REPAYMENT_RECEIVED = "repayment_received"
    PAYMENT_FAILED = "payment_failed"
    MANDATE_BOUNCE = "mandate_bounce"
    PROMISE_TO_PAY_SET = "promise_to_pay_set"
    PROMISE_TO_PAY_BROKEN = "promise_to_pay_broken"
    LOAN_CLOSED = "loan_closed"
    LIMIT_INCREASE_REQUESTED = "limit_increase_requested"
    REFUND_ISSUED = "refund_issued"
    BUREAU_REPORT_RECEIVED = "bureau_report_received"
    FRAUD_FLAG_SET = "fraud_flag_set"
    FRAUD_FLAG_CLEARED = "fraud_flag_cleared"
    CONSENT_CHANGED = "consent_changed"
    # a keyed digest of a device, payout account or phone, for the identity-ring rule; never the raw value
    IDENTIFIER_SEEN = "identifier_seen"
    # written by the service itself when ops approve or revoke an override; refused on POST /v1/events
    OVERRIDE_APPROVED = "override_approved"
    OVERRIDE_REVOKED = "override_revoked"


INTERNAL_EVENT_TYPES = frozenset({EventType.OVERRIDE_APPROVED, EventType.OVERRIDE_REVOKED})


class OverrideField(StrEnum):
    """What an approved override may change. Overrides adjust the limit recommendation, never KRS itself."""

    LADDER_LEVEL = "ladder_level"  # value: 0..6
    LIMIT_CAP_PAISE = "limit_cap_paise"  # value: paise
    PAUSE_NEW_LOANS = "pause_new_loans"  # value: 1


class IdentifierKind(StrEnum):
    DEVICE = "device"
    PAYOUT_ACCOUNT = "payout_account"
    PHONE = "phone"


class AlertRule(StrEnum):
    FARMING = "FARMING"
    COLLUSION = "COLLUSION"
    VENDOR_ANOMALY = "VENDOR_ANOMALY"
    VELOCITY = "VELOCITY"
    RING = "RING"
    ROLLOVER = "ROLLOVER"


class Severity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertStatus(StrEnum):
    """open → confirmed | dismissed. A confirmed alert that set a knockout flag can be lifted by maker-checker:
    confirmed → lift_pending → lifted (or back to confirmed if the checker rejects)."""

    OPEN = "open"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"
    LIFT_PENDING = "lift_pending"
    LIFTED = "lifted"


class KycLevel(StrEnum):
    NONE = "none"
    BASIC = "basic"
    FULL = "full"


class Decision(StrEnum):
    APPROVED = "approved"
    DECLINED = "declined"


class DecidedBy(StrEnum):
    NBFC = "nbfc"
    POLICY = "policy"


class Channel(StrEnum):
    QR = "qr"
    PICKER = "picker"


class Rail(StrEnum):
    UPI = "upi"
    CARD = "card"
    NETBANKING = "netbanking"
    MANDATE = "mandate"


class FailureClass(StrEnum):
    """`technical` failures (bank or UPI downtime, gateway timeout) are stored but never scored."""

    INSUFFICIENT_FUNDS = "insufficient_funds"
    DECLINED = "declined"
    TECHNICAL = "technical"


class ClosureType(StrEnum):
    REPAID = "repaid"
    PREPAID = "prepaid"
    SETTLED = "settled"
    RESTRUCTURED = "restructured"
    WRITTEN_OFF = "written_off"


NEGATIVE_CLOSURES = frozenset({ClosureType.SETTLED, ClosureType.RESTRUCTURED, ClosureType.WRITTEN_OFF})


class Bureau(StrEnum):
    CIBIL = "cibil"
    EXPERIAN = "experian"
    EQUIFAX = "equifax"
    CRIF = "crif"


class ConsentPurpose(StrEnum):
    SCORING = "scoring"
    BUREAU_PULL = "bureau_pull"
    REMINDERS = "reminders"
    MARKETING = "marketing"


class LoanState(StrEnum):
    """Bullet-loan lifecycle. `pending` means money events arrived before the loan's lifecycle events.

    A loan that went overdue and was then paid in full (the "cured" case) is `paid_late`; its `max_dpd` keeps the
    history. Acceptance has no event of its own: `loan_disbursed` moves an offer straight to `active`.
    """

    PENDING = "pending"
    APPLIED = "applied"
    DECLINED = "declined"
    OFFERED = "offered"
    ACTIVE = "active"
    OVERDUE = "overdue"
    PAID_EARLY = "paid_early"
    PAID_ON_TIME = "paid_on_time"
    PAID_LATE = "paid_late"
    CLOSED = "closed"
    SETTLED = "settled"
    RESTRUCTURED = "restructured"
    WRITTEN_OFF = "written_off"


class UserStatus(StrEnum):
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"
