"""Turns one stored event into read-model rows (users, vendors, loans, repayments, attempts, consents).

Loans are re-folded from all of their events every time, so the result does not depend on arrival order and
re-processing an event changes nothing.
"""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.repositories import EventRepository, ProjectionRepository
from app.domain.enums import EventType, KycLevel
from app.domain.loans import fold_loan
from app.domain.records import EventRecord


def project(session: Session, ev: EventRecord, as_of: datetime) -> None:
    events = EventRepository(session)
    rows = ProjectionRepository(session)
    p = ev.payload

    rows.touch_user(ev.user_id, ev.occurred_at, ev.synthetic)

    if ev.type == EventType.USER_VERIFIED:
        latest = events.latest_of_type(ev.user_id, EventType.USER_VERIFIED)
        lp = latest.payload
        rows.set_identity(
            ev.user_id,
            KycLevel(lp["kyc_level"]).value,
            lp["college_id_verified"] and lp["college_email_verified"],
            date.fromisoformat(lp["phone_first_seen_at"]) if lp.get("phone_first_seen_at") else None,
        )
    elif ev.type == EventType.CONSENT_CHANGED:
        rows.add_consent(ev.event_id, ev.user_id, p["purpose"], p["granted"], ev.occurred_at, p["text_version"])
    elif ev.type == EventType.IDENTIFIER_SEEN:
        rows.add_identity_link(p["kind"], p["digest"], ev.user_id, ev.occurred_at)

    if "vendor_id" in p:
        rows.touch_vendor(UUID(p["vendor_id"]), ev.occurred_at, ev.synthetic)
    if ev.type == EventType.SPEND_MADE:
        rows.add_spend(ev.event_id, ev.user_id, UUID(p["loan_id"]), UUID(p["vendor_id"]), p["amount_paise"],
                       ev.occurred_at, ev.synthetic)

    if "loan_id" not in p:
        return
    loan_id = UUID(p["loan_id"])
    view = fold_loan(loan_id, events.for_loan(loan_id), as_of)
    if view is None:  # the event is dated after as_of; the nightly re-score picks it up
        return
    rows.upsert_loan(view)

    if ev.type == EventType.REPAYMENT_RECEIVED:
        rows.add_repayment(ev.event_id, loan_id, p["amount_paise"], datetime.fromisoformat(p["paid_at"]), p["rail"])
    elif ev.type in (EventType.PAYMENT_FAILED, EventType.MANDATE_BOUNCE):
        rows.add_failed_attempt(ev.event_id, loan_id, p["amount_paise"], p["failure_class"], p["rail"], ev.occurred_at)
