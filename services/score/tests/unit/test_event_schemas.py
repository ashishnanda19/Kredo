import pytest
from pydantic import TypeAdapter, ValidationError

from app.domain.enums import EventType
from app.events.schemas import PAYLOADS, EnvelopeBase, EventIn
from tests.factories import event, uid
from tests.protected import mentions_protected

ADAPTER = TypeAdapter(EventIn)


def all_field_names() -> set[str]:
    names = set(EnvelopeBase.model_fields)
    for model in PAYLOADS.values():
        names |= set(model.model_fields)
    return names


def test_every_event_type_has_a_payload_model():
    assert set(PAYLOADS) == set(EventType)


def test_no_protected_or_proxy_field_in_any_event():
    # events are the only way data gets in, so no event field may carry a protected attribute
    assert {n: mentions_protected(n) for n in all_field_names() if mentions_protected(n)} == {}


def test_unknown_payload_fields_are_rejected():
    wire = event(EventType.LOAN_APPLIED, "aanya", {"loan_id": str(uid("l1")), "requested_amount_paise": 100_000})
    wire["payload"]["gender"] = "f"
    with pytest.raises(ValidationError, match="Extra inputs are not permitted"):
        ADAPTER.validate_python(wire)


def test_unknown_envelope_fields_are_rejected():
    wire = event(EventType.LOAN_APPLIED, "aanya", {"loan_id": str(uid("l1")), "requested_amount_paise": 100_000})
    wire["phone"] = "9999999999"
    with pytest.raises(ValidationError):
        ADAPTER.validate_python(wire)


def test_naive_timestamps_are_rejected():
    wire = event(EventType.LOAN_APPLIED, "aanya", {"loan_id": str(uid("l1")), "requested_amount_paise": 100_000})
    wire["occurred_at"] = "2026-10-01T06:00:00"
    with pytest.raises(ValidationError):
        ADAPTER.validate_python(wire)


@pytest.mark.parametrize("amount", [0, -100, 1.5, "100"])
def test_amounts_must_be_positive_integer_paise(amount):
    wire = event(EventType.LOAN_APPLIED, "aanya", {"loan_id": str(uid("l1")), "requested_amount_paise": amount})
    with pytest.raises(ValidationError):
        ADAPTER.validate_python(wire)


def test_payload_is_checked_against_its_own_type():
    wire = event(EventType.LOAN_CLOSED, "aanya", {"loan_id": str(uid("l1")), "requested_amount_paise": 100_000})
    with pytest.raises(ValidationError):
        ADAPTER.validate_python(wire)


def test_valid_event_parses():
    wire = event(EventType.PAYMENT_FAILED, "aanya", {
        "loan_id": str(uid("l1")), "amount_paise": 115_000, "failure_class": "technical", "rail": "upi",
    })
    parsed = ADAPTER.validate_python(wire)
    assert parsed.type == "payment_failed"
    assert parsed.payload.failure_class == "technical"
