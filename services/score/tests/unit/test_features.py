"""One or more positive and negative cases per feature family."""

from datetime import UTC, date, datetime, timedelta

import pytest

from app.config.loader import build_config, load_config
from app.domain.enums import EventType
from app.features import FEATURE_NAMES, compute_features
from app.features.history import History
from tests.factories import uid
from tests.golden.personas import LIMIT, START, Persona
from tests.protected import mentions_protected

CFG = load_config()


def features(p: Persona, t: datetime, cfg=CFG) -> dict:
    return compute_features(History.build(p.records()), t, cfg)


def student(name="feature-student") -> Persona:
    return Persona(name).verify()


def day(n: float) -> datetime:
    return START + timedelta(days=n)


# protected attributes ------------------------------------------------------------------------------------------------

def test_no_protected_or_proxy_attribute_is_a_scoring_input():
    offenders = {n: mentions_protected(n) for n in FEATURE_NAMES if mentions_protected(n)}
    assert offenders == {}


def test_the_protected_check_would_catch_one():
    assert mentions_protected("f13_college_name") and mentions_protected("gender") and mentions_protected("pin_code")
    assert mentions_protected("f14_college") and not mentions_protected("f10_college_verified")


# F1 on-time rate -----------------------------------------------------------------------------------------------------

def test_f1_all_on_time_is_1():
    p = student()
    p.loan(day(1), paid_after_days=15)
    p.loan(day(30), paid_after_days=15)
    assert features(p, day(60))["f1_ontime_rate"] == 1.0


@pytest.mark.parametrize(("paid_after", "rate"), [(21.2, 1.0), (22.2, 0.0)])
def test_f1_grace_day_is_on_time_and_two_days_late_is_not(paid_after, rate):
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=paid_after)  # due + 1 day (grace) / due + 2 days
    assert features(p, day(80))["f1_ontime_rate"] == rate


def test_f1_recent_loans_weigh_more():
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=40)     # late, long ago
    p.loan(day(200), term_days=20, paid_after_days=15)   # on time, recent
    assert features(p, day(240))["f1_ontime_rate"] > 0.75


def test_f1_unpaid_loan_past_grace_counts_as_not_on_time():
    p = student()
    p.loan(day(1), paid_after_days=15)
    p.loan(day(30), paid_after_days=None)
    assert features(p, day(60))["f1_ontime_rate"] < 0.6


def test_f1_none_before_any_outcome():
    p = student()
    p.loan(day(1), paid_after_days=None)
    assert features(p, day(5))["f1_ontime_rate"] is None


# F2 / F3 lateness ----------------------------------------------------------------------------------------------------

def test_f2_takes_the_worst_lateness_in_six_months_and_forgets_older():
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=33)  # 13 days late
    p.loan(day(40), paid_after_days=15)
    assert features(p, day(60))["f2_worst_dpd"] == 13
    assert features(p, day(34 + 184))["f2_worst_dpd"] == 0


def test_f2_and_f3_ignore_the_grace_day():
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=None)
    f = features(p, datetime(2026, 1, 27, 12, tzinfo=UTC))  # due 26 Jan, now 27 Jan IST: 1 day past due
    assert (f["f2_worst_dpd"], f["f3_current_dpd"]) == (0, 0)
    f = features(p, datetime(2026, 1, 30, 12, tzinfo=UTC))
    assert (f["f2_worst_dpd"], f["f3_current_dpd"]) == (4, 4)


def test_f3_only_counts_open_loans():
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=30)
    assert features(p, day(40))["f3_current_dpd"] == 0


# F4 failures ---------------------------------------------------------------------------------------------------------

def _fail(p: Persona, at: datetime, failure_class="insufficient_funds", loan=None):
    p.add(EventType.PAYMENT_FAILED, at, {"loan_id": loan or str(p.records()[-1].payload.get("loan_id")),
                                         "amount_paise": 10_000, "failure_class": failure_class, "rail": "upi"})


def test_f4_technical_failures_are_never_scored():
    p = student()
    lid = p.loan(day(1), paid_after_days=15)
    _fail(p, day(10), "technical", lid)
    assert features(p, day(20))["f4_failure_weight"] == 0


def test_f4_recency_weighted_within_90_days():
    p = student()
    lid = p.loan(day(1), paid_after_days=15)
    _fail(p, day(10), loan=lid)
    _fail(p, day(10), "declined", loan=lid)
    assert features(p, day(10))["f4_failure_weight"] == pytest.approx(2.0)
    assert features(p, day(100))["f4_failure_weight"] == pytest.approx(2 * 0.5 ** (90 / 90))
    assert features(p, day(101))["f4_failure_weight"] == 0


def test_f4_broken_promise_counts():
    p = student()
    lid = p.loan(day(1), paid_after_days=None)
    p.add(EventType.PROMISE_TO_PAY_BROKEN, day(25), {"loan_id": lid, "promised_date": "2026-01-29"})
    assert features(p, day(25))["f4_failure_weight"] == pytest.approx(1.0)


def test_f4_partial_payment_below_minimum_on_due_date_counts():
    p = student()
    lid = p.loan(day(1), term_days=20, paid_after_days=None)
    p.add(EventType.REPAYMENT_RECEIVED, day(18), {"loan_id": lid, "amount_paise": 40_000,
                                                  "paid_at": day(18).isoformat(), "rail": "upi"})
    assert features(p, day(20))["f4_failure_weight"] == 0  # due date not over yet
    assert features(p, day(23))["f4_failure_weight"] > 0.9


# F5 / F6 / F7 borrowing patterns -------------------------------------------------------------------------------------

def test_f5_rollover_counts_reopening_within_24_hours():
    p = student()
    p.loan(day(1), paid_after_days=15)
    p.loan(day(16.5), paid_after_days=15)  # 12 hours after repaying
    p.loan(day(60), paid_after_days=15)    # weeks later
    assert features(p, day(90))["f5_rollover_share"] == pytest.approx(1 / 3, abs=1e-6)


def test_f5_opening_before_repaying_counts_as_rollover():
    p = student()
    p.loan(day(1), paid_after_days=15)
    p.loan(day(10), paid_after_days=15)
    assert features(p, day(40))["f5_rollover_share"] == 0.5


def test_f6_counts_loans_open_now():
    p = student()
    p.loan(day(1), paid_after_days=None)
    p.loan(day(2), paid_after_days=None)
    p.loan(day(3), paid_after_days=5)
    assert features(p, day(4))["f6_open_loans"] == 3
    assert features(p, day(9))["f6_open_loans"] == 2


def test_f7_average_of_last_three_and_all_maxed():
    p = student()
    for i, pct in enumerate((10, 96, 97, 99)):
        p.loan(day(1 + 30 * i), paid_after_days=15, amount=LIMIT * pct // 100)
    f = features(p, day(120))
    assert f["f7_utilisation"] == pytest.approx((0.96 + 0.97 + 0.99) / 3, abs=1e-6)
    assert f["f7_all_maxed"] is True


def test_f7_ignores_loans_without_a_known_limit():
    p = student()
    p.loan(day(1), paid_after_days=15, limit=None)
    assert features(p, day(20))["f7_utilisation"] is None


# F8 / F9 closures and track record -----------------------------------------------------------------------------------

def test_f8_counts_clean_early_and_negative_closures():
    p = student()
    p.loan(day(1), term_days=20, paid_after_days=10)          # early
    p.loan(day(30), term_days=20, paid_after_days=19)         # on time
    p.loan(day(60), term_days=20, paid_after_days=None)
    p.add(EventType.LOAN_CLOSED, day(120), {"loan_id": p.records()[-1].payload["loan_id"],
                                             "closure_type": "settled"})
    f = features(p, day(130))
    assert (f["f8_clean_closures"], f["f8_early_repayments"], f["f8_settled"]) == (2, 1, 1)


def test_f9_quick_repays_count_a_quarter_and_tenure_needs_six_months():
    p = student()
    p.loan(day(1), paid_after_days=1)
    p.loan(day(30), paid_after_days=15)
    f = features(p, day(60))
    assert f["f9_closed_weighted"] == pytest.approx(1.25)
    assert f["f9_months_on_kredo"] == 2  # 5 Jan → 6 Mar
    assert features(p, day(185))["f9_months_on_kredo"] == 6


# F10 identity / F11 hunger / F12 bureau ------------------------------------------------------------------------------

def test_f10_reads_only_verification_status_and_phone_age():
    p = Persona("identity").verify(kyc="basic", phone=date(2026, 1, 1))
    f = features(p, day(1))
    assert (f["f10_kyc_level"], f["f10_college_verified"], f["f10_phone_age_days"]) == ("basic", False, 5)


def test_f11_counts_requests_and_declines_in_30_days():
    p = student()
    p.add(EventType.LIMIT_INCREASE_REQUESTED, day(1), {"requested_limit_paise": 500_000})
    p.add(EventType.LIMIT_INCREASE_REQUESTED, day(2), {"requested_limit_paise": 500_000})
    p.add(EventType.LOAN_DECIDED, day(3), {"loan_id": str(uid("declined-loan")), "decision": "declined",
                                           "decided_by": "policy"})
    assert features(p, day(10))["f11_credit_requests"] == 3
    assert features(p, day(40))["f11_credit_requests"] == 0


def _bureau(p: Persona, consent: bool) -> Persona:
    p.add(EventType.CONSENT_CHANGED, day(1), {"purpose": "bureau_pull", "granted": consent, "text_version": "v1"})
    p.add(EventType.BUREAU_REPORT_RECEIVED, day(2), {"bureau": "cibil", "score_band": "B", "ntc": False,
                                                     "consent_id": str(uid("bureau-consent"))})
    return p


def test_f12_off_by_default():
    assert features(_bureau(student(), True), day(3))["f12_bureau"] is None


def test_f12_needs_policy_and_consent():
    import copy

    import yaml

    from app.config.loader import DEFAULT_POLICY, DEFAULT_SCORECARD
    pol = yaml.safe_load(DEFAULT_POLICY.read_text())
    pol["bureau"]["enabled"] = True
    on = build_config(yaml.safe_load(DEFAULT_SCORECARD.read_text()), copy.deepcopy(pol))
    assert features(_bureau(student(), True), day(3), on)["f12_bureau"] == "B"
    assert features(_bureau(student("no-consent"), False), day(3), on)["f12_bureau"] is None
