"""Event contracts for POST /v1/events.

Money is integer paise (fields end in `_paise`). Every model forbids unknown fields, so nothing outside the contract
(names, phone numbers, gender, college name...) can slip into the event log.
"""

from datetime import date
from typing import Annotated, Literal, Union
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, create_model

from app.domain.enums import (
    Bureau,
    Channel,
    ClosureType,
    ConsentPurpose,
    DecidedBy,
    Decision,
    EventType,
    FailureClass,
    IdentifierKind,
    KycLevel,
    OverrideField,
    Rail,
    Source,
)

# strict: "100" or 1.0 is a caller bug, not an amount. The ₹1 crore cap catches rupees-vs-paise mistakes.
Paise = Annotated[int, Field(gt=0, le=10_000_000_00, strict=True)]
Code = Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[A-Z0-9_]+$")]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class UserVerified(Strict):
    kyc_level: KycLevel
    college_id_verified: bool
    college_email_verified: bool
    phone_first_seen_at: date | None = None


class LoanApplied(Strict):
    loan_id: UUID
    requested_amount_paise: Paise


class LoanDecided(Strict):
    loan_id: UUID
    decision: Decision
    decided_by: DecidedBy
    reason_codes: list[Code] = Field(default_factory=list, max_length=20)


class LoanDisbursed(Strict):
    loan_id: UUID
    principal_paise: Paise
    fees_paise: Annotated[int, Field(ge=0, le=10_000_000_00, strict=True)]
    due_date: date
    vendor_ids: list[UUID] = Field(default_factory=list, max_length=50)
    # the credit limit in force when this loan was drawn; utilisation (F7) needs it
    limit_paise: Paise | None = None


class SpendMade(Strict):
    loan_id: UUID
    vendor_id: UUID
    amount_paise: Paise
    channel: Channel
    # opaque campus id, used only by the fraud velocity rule (spends on 2+ campuses in a day); never a scoring input
    campus_id: UUID | None = None


class RepaymentReceived(Strict):
    loan_id: UUID
    amount_paise: Paise
    paid_at: AwareDatetime
    rail: Rail


class PaymentFailed(Strict):
    loan_id: UUID
    amount_paise: Paise
    failure_class: FailureClass
    rail: Rail


class MandateBounce(Strict):
    loan_id: UUID
    amount_paise: Paise
    failure_class: FailureClass
    rail: Literal[Rail.MANDATE] = Rail.MANDATE


class PromiseToPay(Strict):
    loan_id: UUID
    promised_date: date


class LoanClosed(Strict):
    loan_id: UUID
    closure_type: ClosureType


class LimitIncreaseRequested(Strict):
    requested_limit_paise: Paise


class RefundIssued(Strict):
    loan_id: UUID
    vendor_id: UUID
    amount_paise: Paise


class BureauReportReceived(Strict):
    bureau: Bureau
    score_band: Annotated[str, Field(min_length=1, max_length=16)]
    ntc: bool
    consent_id: UUID


class FraudFlag(Strict):
    flag_type: Code
    # ops-written; keep personal data out of it (it is stored in the append-only log)
    reason: Annotated[str, Field(min_length=1, max_length=280)]
    actor_id: UUID
    # the fraud alert behind a flag the service wrote itself; set and clear pair up on (flag_type, ref).
    # Refused on POST /v1/events, so a caller cannot clear a flag that ops set.
    ref: UUID | None = None


class IdentifierSeen(Strict):
    """The sender digests the raw value with its own secret key (HMAC-SHA256, hex); Kredo never sees the value."""

    kind: IdentifierKind
    digest: Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]


class ConsentChanged(Strict):
    purpose: ConsentPurpose
    granted: bool
    text_version: Annotated[str, Field(min_length=1, max_length=32)]


class OverrideApproved(Strict):
    override_id: UUID
    field: OverrideField
    value: Annotated[int, Field(ge=0, strict=True)]
    expires_at: AwareDatetime


class OverrideRevoked(Strict):
    override_id: UUID


PAYLOADS: dict[EventType, type[Strict]] = {
    EventType.USER_VERIFIED: UserVerified,
    EventType.LOAN_APPLIED: LoanApplied,
    EventType.LOAN_DECIDED: LoanDecided,
    EventType.LOAN_DISBURSED: LoanDisbursed,
    EventType.SPEND_MADE: SpendMade,
    EventType.REPAYMENT_RECEIVED: RepaymentReceived,
    EventType.PAYMENT_FAILED: PaymentFailed,
    EventType.MANDATE_BOUNCE: MandateBounce,
    EventType.PROMISE_TO_PAY_SET: PromiseToPay,
    EventType.PROMISE_TO_PAY_BROKEN: PromiseToPay,
    EventType.LOAN_CLOSED: LoanClosed,
    EventType.LIMIT_INCREASE_REQUESTED: LimitIncreaseRequested,
    EventType.REFUND_ISSUED: RefundIssued,
    EventType.BUREAU_REPORT_RECEIVED: BureauReportReceived,
    EventType.FRAUD_FLAG_SET: FraudFlag,
    EventType.FRAUD_FLAG_CLEARED: FraudFlag,
    EventType.CONSENT_CHANGED: ConsentChanged,
    EventType.IDENTIFIER_SEEN: IdentifierSeen,
    EventType.OVERRIDE_APPROVED: OverrideApproved,
    EventType.OVERRIDE_REVOKED: OverrideRevoked,
}


class EnvelopeBase(Strict):
    event_id: UUID
    idempotency_key: Annotated[str, Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")]
    user_id: UUID
    occurred_at: AwareDatetime
    source: Source
    schema_version: Literal[1] = 1
    synthetic: bool = False


def _envelope(event_type: EventType, payload: type[Strict]) -> type[EnvelopeBase]:
    name = "".join(part.title() for part in event_type.value.split("_")) + "Event"
    return create_model(
        name,
        __base__=EnvelopeBase,
        type=(Literal[event_type.value], ...),
        payload=(payload, ...),
    )


EVENT_MODELS = tuple(_envelope(t, p) for t, p in PAYLOADS.items())
EventIn = Annotated[Union[EVENT_MODELS], Field(discriminator="type")]  # noqa: UP007


class EventBatch(Strict):
    events: list[EventIn] = Field(min_length=1, max_length=500)


class IngestResponse(BaseModel):
    accepted: list[UUID]
    duplicate: list[UUID]
