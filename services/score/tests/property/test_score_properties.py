"""Property tests for the safety rails: monotonicity, early repayment never penalised, determinism, velocity cap.

Histories are random sequences of loans. Loan opening times never depend on repayment times, so each change below
alters exactly one thing. Repayments land 4+ days after disbursal, outside the quick-repay (anti-farming) window,
whose discount is a deliberate trade-off covered by its own tests.
"""

from dataclasses import dataclass, replace
from datetime import timedelta

from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app.config.loader import load_config
from app.domain.enums import EventType
from app.features.history import History
from app.scoring.engine import capped_series, score
from tests.golden.personas import LIMIT, START, Persona

CFG = load_config()
GRACE = CFG.policy.repayment.grace_days
SETTINGS = settings(max_examples=300, deadline=None, suppress_health_check=[HealthCheck.too_slow])


@dataclass(frozen=True)
class LoanSpec:
    gap_days: int  # after the previous loan opened
    term_days: int
    pay_offset: int | None  # days relative to the due date; None = never repaid
    util_pct: int


loan_specs = st.builds(
    LoanSpec,
    gap_days=st.integers(1, 40),
    term_days=st.integers(15, 30),
    pay_offset=st.one_of(st.none(), st.integers(-10, 45)),
    util_pct=st.integers(20, 100),
)


@dataclass(frozen=True)
class Scenario:
    loans: tuple[LoanSpec, ...]
    failure_days: tuple[int, ...]
    as_of_days: int


scenarios = st.builds(
    Scenario,
    loans=st.lists(loan_specs, min_size=1, max_size=7).map(tuple),
    failure_days=st.lists(st.integers(1, 300), max_size=3).map(tuple),
    as_of_days=st.integers(20, 420),
)


def build(s: Scenario) -> Persona:
    p = Persona("property-student").verify()
    opened = START
    first_loan = None
    for spec in s.loans:
        opened = opened + timedelta(days=spec.gap_days)
        paid_after = None if spec.pay_offset is None else spec.term_days + spec.pay_offset + 0.25
        lid = p.loan(opened, term_days=spec.term_days, paid_after_days=paid_after,
                     amount=LIMIT * spec.util_pct // 100)
        first_loan = first_loan or lid
    for d in s.failure_days:
        p.add(EventType.PAYMENT_FAILED, START + timedelta(days=d, hours=1), {
            "loan_id": first_loan, "amount_paise": 50_000, "failure_class": "insufficient_funds", "rail": "upi"})
    return p


def krs(s: Scenario) -> int:
    return score(build(s).records(), START + timedelta(days=s.as_of_days), CFG).krs


def with_loan(s: Scenario, i: int, **changes) -> Scenario:
    loans = list(s.loans)
    loans[i] = replace(loans[i], **changes)
    return replace(s, loans=tuple(loans))


@SETTINGS
@given(scenarios, st.data())
def test_paying_a_late_or_unpaid_loan_on_time_never_lowers_krs(s, data):
    late = [i for i, spec in enumerate(s.loans) if spec.pay_offset is None or spec.pay_offset > GRACE]
    if not late:
        return
    i = data.draw(st.sampled_from(late))
    assert krs(with_loan(s, i, pay_offset=0)) >= krs(s)


@SETTINGS
@given(scenarios, st.data())
def test_more_days_past_due_never_raises_krs(s, data):
    paid = [i for i, spec in enumerate(s.loans) if spec.pay_offset is not None]
    if not paid:
        return
    i = data.draw(st.sampled_from(paid))
    extra = data.draw(st.integers(1, 40))
    assert krs(with_loan(s, i, pay_offset=s.loans[i].pay_offset + extra)) <= krs(s)


@SETTINGS
@given(scenarios, st.data())
def test_repaying_earlier_is_never_penalised(s, data):
    paid = [i for i, spec in enumerate(s.loans) if spec.pay_offset is not None and spec.pay_offset > -10]
    if not paid:
        return
    i = data.draw(st.sampled_from(paid))
    earlier = data.draw(st.integers(-10, s.loans[i].pay_offset - 1))
    assert krs(with_loan(s, i, pay_offset=earlier)) >= krs(s)


@SETTINGS
@given(scenarios, st.integers(1, 300))
def test_a_scored_payment_failure_never_raises_krs(s, day):
    assert krs(replace(s, failure_days=(*s.failure_days, day))) <= krs(s)


@SETTINGS
@given(scenarios, st.data())
def test_lower_utilisation_never_lowers_krs(s, data):
    i = data.draw(st.integers(0, len(s.loans) - 1))
    lower = data.draw(st.integers(1, s.loans[i].util_pct))
    assert krs(with_loan(s, i, util_pct=lower)) >= krs(s)


@SETTINGS
@given(scenarios, st.randoms(use_true_random=False))
def test_same_events_in_any_order_give_the_same_score(s, rnd):
    records = build(s).records()
    shuffled = list(records)
    rnd.shuffle(shuffled)
    as_of = START + timedelta(days=s.as_of_days)
    assert score(shuffled, as_of, CFG) == score(records, as_of, CFG)


@SETTINGS
@given(scenarios)
def test_krs_never_rises_more_than_the_cap_in_any_window(s):
    """Everything except clearing an overdue amount (F3, uncapped by design) rises at most max_rise per window."""
    cap = CFG.scorecard.velocity_cap
    h = History.build(build(s).records())
    series = capped_series(h, START + timedelta(days=s.as_of_days), CFG)
    parts = [d.capped_part for d in series]
    for i, part in enumerate(parts):
        window = parts[max(0, i - cap.window_days):i]
        if window:
            assert part - min(window) <= cap.max_rise
    assert all(d.krs <= d.raw for d in series)


@SETTINGS
@given(scenarios)
def test_without_overdue_loans_the_final_score_obeys_the_cap(s):
    s = replace(s, loans=tuple(replace(spec, pay_offset=min(spec.pay_offset or 0, 0)) for spec in s.loans))
    cap = CFG.scorecard.velocity_cap
    series = [d.krs for d in capped_series(History.build(build(s).records()), START + timedelta(days=s.as_of_days),
                                           CFG)]
    for i, k in enumerate(series):
        window = series[max(0, i - cap.window_days):i]
        if window:
            assert k - min(window) <= cap.max_rise


def test_the_builder_is_deterministic():
    # if building the same scenario twice gave different events, the order test above would prove nothing
    s = Scenario((LoanSpec(3, 20, 0, 50),), (), 60)
    assert build(s).wire == build(s).wire
