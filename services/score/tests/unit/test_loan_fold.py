from datetime import UTC, date, datetime, timedelta

from hypothesis import given
from hypothesis import strategies as st

from app.domain.enums import ClosureType, EventType, LoanState
from app.domain.loans import fold_loan
from tests.factories import T0, disbursed, event, record, repaid, uid

DUE = date(2026, 10, 20)
LOAN = uid("l1")


def at_ist(d: date, hour: int, minute: int = 0) -> datetime:
    """A wall-clock time in India, as UTC."""
    return datetime(d.year, d.month, d.day, hour, minute, tzinfo=UTC) - timedelta(hours=5, minutes=30)


def fold(*wires, as_of: datetime):
    return fold_loan(LOAN, [record(w) for w in wires], as_of)


def test_applied_then_offered_then_declined():
    applied = event(EventType.LOAN_APPLIED, "a", {"loan_id": str(LOAN), "requested_amount_paise": 100_000})
    assert fold(applied, as_of=T0).state == LoanState.APPLIED
    ok = event(EventType.LOAN_DECIDED, "a", {"loan_id": str(LOAN), "decision": "approved", "decided_by": "nbfc"},
               T0 + timedelta(minutes=1))
    assert fold(applied, ok, as_of=T0 + timedelta(hours=1)).state == LoanState.OFFERED
    no = event(EventType.LOAN_DECIDED, "a", {"loan_id": str(LOAN), "decision": "declined", "decided_by": "policy"},
               T0 + timedelta(minutes=1))
    assert fold(applied, no, as_of=T0 + timedelta(hours=1)).state == LoanState.DECLINED


def test_active_until_due_then_overdue():
    d = disbursed("a", "l1", 100_000, DUE, fees=1_500)
    v = fold(d, as_of=at_ist(DUE, 23, 59))
    assert (v.state, v.outstanding, v.max_dpd) == (LoanState.ACTIVE, 101_500, 0)
    v = fold(d, as_of=at_ist(DUE + timedelta(days=12), 9))
    assert (v.state, v.max_dpd) == (LoanState.OVERDUE, 12)


def test_paid_late_at_2330_ist_on_the_due_date_counts_as_on_time():
    paid = at_ist(DUE, 23, 30)  # 18:00 UTC: still the due date in India
    v = fold(disbursed("a", "l1", 100_000, DUE), repaid("a", "l1", 100_000, paid), as_of=paid + timedelta(days=3))
    assert (v.state, v.max_dpd) == (LoanState.PAID_ON_TIME, 0)


def test_grace_day_is_on_time_and_the_day_after_is_late():
    on_grace = at_ist(DUE + timedelta(days=1), 20)
    v = fold(disbursed("a", "l1", 100_000, DUE), repaid("a", "l1", 100_000, on_grace), as_of=on_grace)
    assert (v.state, v.max_dpd) == (LoanState.PAID_ON_TIME, 1)
    late = at_ist(DUE + timedelta(days=2), 10)
    v = fold(disbursed("a", "l1", 100_000, DUE), repaid("a", "l1", 100_000, late), as_of=late)
    assert (v.state, v.max_dpd) == (LoanState.PAID_LATE, 2)


def test_early_means_two_or_more_days_before_due():
    two_before = at_ist(DUE - timedelta(days=2), 12)
    v = fold(disbursed("a", "l1", 100_000, DUE), repaid("a", "l1", 100_000, two_before), as_of=two_before)
    assert v.state == LoanState.PAID_EARLY
    one_before = at_ist(DUE - timedelta(days=1), 12)
    v = fold(disbursed("a", "l1", 100_000, DUE), repaid("a", "l1", 100_000, one_before), as_of=one_before)
    assert v.state == LoanState.PAID_ON_TIME


def test_partial_payments_keep_dpd_running_until_cleared():
    d = disbursed("a", "l1", 100_000, DUE)
    p1 = repaid("a", "l1", 60_000, at_ist(DUE, 10))
    p2 = repaid("a", "l1", 40_000, at_ist(DUE + timedelta(days=9), 10))
    mid = fold(d, p1, as_of=at_ist(DUE + timedelta(days=5), 10))
    assert (mid.state, mid.outstanding, mid.max_dpd) == (LoanState.OVERDUE, 40_000, 5)
    end = fold(d, p1, p2, as_of=at_ist(DUE + timedelta(days=30), 10))
    assert (end.state, end.outstanding, end.max_dpd) == (LoanState.PAID_LATE, 0, 9)


def test_refund_reduces_what_is_owed():
    d = disbursed("a", "l1", 100_000, DUE)
    refund = event(EventType.REFUND_ISSUED, "a", {"loan_id": str(LOAN), "vendor_id": str(uid("v1")),
                                                  "amount_paise": 30_000}, T0 + timedelta(days=1))
    p = repaid("a", "l1", 70_000, at_ist(DUE - timedelta(days=3), 10))
    v = fold(d, refund, p, as_of=at_ist(DUE, 12))
    assert (v.state, v.outstanding) == (LoanState.PAID_EARLY, 0)


def test_write_off_stops_dpd_at_closure():
    d = disbursed("a", "l1", 100_000, DUE)
    closed = event(EventType.LOAN_CLOSED, "a", {"loan_id": str(LOAN), "closure_type": "written_off"},
                   at_ist(DUE + timedelta(days=120), 10))
    v = fold(d, closed, as_of=at_ist(DUE + timedelta(days=200), 10))
    assert (v.state, v.closure_type, v.max_dpd) == (LoanState.WRITTEN_OFF, ClosureType.WRITTEN_OFF, 120)


def test_events_after_as_of_are_ignored():
    d = disbursed("a", "l1", 100_000, DUE)
    p = repaid("a", "l1", 100_000, at_ist(DUE, 10))
    v = fold(d, p, as_of=at_ist(DUE - timedelta(days=1), 10))
    assert (v.state, v.outstanding) == (LoanState.ACTIVE, 100_000)


HISTORY = [
    event(EventType.LOAN_APPLIED, "a", {"loan_id": str(LOAN), "requested_amount_paise": 100_000}),
    event(EventType.LOAN_DECIDED, "a", {"loan_id": str(LOAN), "decision": "approved", "decided_by": "nbfc"},
          T0 + timedelta(minutes=1)),
    disbursed("a", "l1", 100_000, DUE, T0 + timedelta(minutes=2), fees=2_000),
    event(EventType.SPEND_MADE, "a", {"loan_id": str(LOAN), "vendor_id": str(uid("v1")), "amount_paise": 100_000,
                                      "channel": "qr"}, T0 + timedelta(minutes=3)),
    repaid("a", "l1", 50_000, at_ist(DUE + timedelta(days=3), 10)),
    event(EventType.PAYMENT_FAILED, "a", {"loan_id": str(LOAN), "amount_paise": 52_000,
                                          "failure_class": "insufficient_funds", "rail": "upi"},
          at_ist(DUE + timedelta(days=5), 10)),
    repaid("a", "l1", 52_000, at_ist(DUE + timedelta(days=11), 10)),
    event(EventType.LOAN_CLOSED, "a", {"loan_id": str(LOAN), "closure_type": "repaid"},
          at_ist(DUE + timedelta(days=11), 11)),
]


@given(st.permutations(HISTORY), st.integers(min_value=0, max_value=60))
def test_fold_is_independent_of_arrival_order(order, days):
    as_of = at_ist(DUE + timedelta(days=days - 20), 15)
    assert fold(*order, as_of=as_of) == fold(*HISTORY, as_of=as_of)


def test_cured_loan_keeps_its_lateness():
    v = fold(*HISTORY, as_of=at_ist(DUE + timedelta(days=40), 10))
    assert (v.state, v.closure_type, v.max_dpd, v.outstanding) == (LoanState.CLOSED, ClosureType.REPAID, 11, 0)
