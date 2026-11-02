"""Outcome labels, decision-time features (no leakage) and the model-health maths."""

import itertools
import uuid
from datetime import timedelta

import pytest

from app.config.loader import load_config
from app.features.history import History
from app.monitoring import labels, metrics
from app.monitoring.outcomes import decision_time, outcome_row
from tests.golden import personas as P

CFG = load_config()
POL = CFG.policy.monitoring.label
OPENED = P.START + timedelta(days=2)
NOW = P.START + timedelta(days=400)


def facts(p: P.Persona, n: int = 0):
    return History.build(p.records()).loans[n]


def one_loan(**kw) -> P.Persona:
    p = P.Persona("labelled").verify()
    p.loan(OPENED, term_days=20, **kw)
    return p


# labels -----------------------------------------------------------------------------------------------------------

def test_a_loan_repaid_on_time_is_good():
    lab = labels.label_loan(facts(one_loan(paid_after_days=18)), POL)
    assert (lab.bad, lab.worst_dpd, lab.reason) == (False, 0, "good")


@pytest.mark.parametrize(("paid_after", "bad", "worst"), [
    (20 + 20, False, 20),  # 20 days late: late, not bad
    (20 + 29, False, 29),  # one day short of the line
    (20 + 30, True, 30),   # 30 DPD is bad
    (20 + 45, True, 45),
])
def test_bad_means_reaching_30_dpd_inside_the_window(paid_after, bad, worst):
    lab = labels.label_loan(facts(one_loan(paid_after_days=paid_after)), POL)
    assert (lab.bad, lab.worst_dpd) == (bad, worst)


def test_an_unpaid_loan_is_bad_at_the_window_end():
    lab = labels.label_loan(facts(one_loan(paid_after_days=None)), POL)
    assert (lab.bad, lab.worst_dpd, lab.reason) == (True, POL.window_days, "dpd")


@pytest.mark.parametrize("closure", ["settled", "restructured", "written_off"])
def test_a_negative_closure_by_the_window_end_is_bad_even_if_paid(closure):
    lab = labels.label_loan(facts(one_loan(paid_after_days=22, closure=closure)), POL)
    assert (lab.bad, lab.reason, lab.closure_type) == (True, "negative_closure", closure)


def test_what_happens_after_the_window_does_not_change_the_label():
    p = one_loan(paid_after_days=22)
    lid = str(P.uid("labelled-loan-1"))
    late = OPENED + timedelta(days=20 + POL.window_days + 10)
    p.add(P.EventType.LOAN_CLOSED, late, {"loan_id": lid, "closure_type": "written_off"})
    assert labels.label_loan(facts(p), POL).bad is False  # the label was known at the window end


def test_a_loan_is_labellable_only_once_the_window_has_closed():
    loan = facts(one_loan(paid_after_days=18))
    end = labels.window_end(loan, POL)
    assert not labels.is_labellable(loan, end - timedelta(seconds=1), POL)
    assert labels.is_labellable(loan, end, POL)


# decision-time features -------------------------------------------------------------------------------------------

def _two_loan_persona() -> tuple[P.Persona, str]:
    p = P.Persona("no-leak").verify()
    p.loan(OPENED, paid_after_days=18)
    second = OPENED + timedelta(days=40)
    lid = p.loan(second, paid_after_days=None)
    return p, lid


def test_features_use_only_events_before_the_decision():
    p, lid = _two_loan_persona()
    base = outcome_row(p.records(), uuid.UUID(lid), CFG, NOW, True)
    assert base is not None and base["bad_flag"] is True  # never repaid
    assert base["features"]["closed_loans"] == 1 and base["features"]["f3_current_dpd"] == 0

    # whatever happens afterwards (a repayment, a failure, a fraud flag) cannot reach the features
    after = OPENED + timedelta(days=60)
    p.add(P.EventType.PAYMENT_FAILED, after, {"loan_id": lid, "amount_paise": 1, "failure_class": "declined",
                                              "rail": "upi"})
    p.add(P.EventType.FRAUD_FLAG_SET, after + timedelta(days=1), {"flag_type": "FRAUD_CONFIRMED", "reason": "x",
                                                                  "actor_id": str(P.uid("a"))})
    again = outcome_row(p.records(), uuid.UUID(lid), CFG, NOW, True)
    for k in ("krs", "pd", "band", "aura", "level", "features", "decision_at"):
        assert again[k] == base[k], k


def test_the_decision_time_is_the_approval_not_the_disbursal():
    p = P.Persona("approved-earlier").verify()
    lid = p.loan(OPENED, paid_after_days=18)
    approved = OPENED - timedelta(hours=3)
    p.add(P.EventType.LOAN_DECIDED, approved, {"loan_id": lid, "decision": "approved", "decided_by": "nbfc",
                                               "reason_codes": []})
    assert decision_time(p.records(), uuid.UUID(lid), OPENED) == approved


def test_an_unlabellable_loan_has_no_outcome():
    p, lid = _two_loan_persona()
    assert outcome_row(p.records(), uuid.UUID(lid), CFG, OPENED + timedelta(days=45), True) is None


# metrics ----------------------------------------------------------------------------------------------------------

def test_psi_is_zero_for_the_same_distribution_and_large_for_a_shift():
    same = [500, 520, 540, 600, 620, 640] * 20
    assert metrics.psi(same, same) == 0
    shifted = [x - 160 for x in same]
    assert metrics.psi(same, shifted) > 0.25
    assert metrics.psi([], same) is None


def test_psi_is_symmetric_enough_to_trust_and_ignores_small_noise():
    a = [500 + (i % 12) * 10 for i in range(240)]
    b = [x + (3 if i % 5 == 0 else 0) for i, x in enumerate(a)]
    assert metrics.psi(a, b) < 0.1


def test_the_drift_series_alerts_only_when_the_latest_month_breaches():
    calm = [500, 520, 540, 600, 620, 640] * 20
    series = metrics.drift_series({"2026-08": calm, "2026-09": calm, "2026-10": [x - 160 for x in calm]},
                                  bin_width=50, alert_above=0.25, min_users=100)
    assert [p["month"] for p in series["points"]] == ["2026-09", "2026-10"]
    assert series["points"][0]["psi"] == 0 and series["alert"] is True
    quiet = metrics.drift_series({"2026-09": calm, "2026-10": calm}, bin_width=50, alert_above=0.25)
    assert quiet["alert"] is False
    assert metrics.drift_series({"2026-10": calm}, bin_width=50, alert_above=0.25)["latest_psi"] is None


def test_drift_ignores_months_with_too_few_students():
    few = [500, 520, 540]
    series = metrics.drift_series({"2026-09": few, "2026-10": [x - 200 for x in few]}, bin_width=50,
                                  alert_above=0.25, min_users=100)
    assert series["points"] == [{"month": "2026-10", "users": 3, "reliable": False, "psi": None}]
    assert series["alert"] is False  # no alert from noise


def test_calibration_compares_predicted_pd_with_the_observed_bad_rate():
    rows = [{"band": "B", "pd": 0.01, "bad": False}] * 24 + [{"band": "B", "pd": 0.01, "bad": True}] * 1
    rows += [{"band": "D", "pd": 0.10, "bad": True}] * 3
    cal = {c["band"]: c for c in metrics.calibration(rows, min_loans=20)}
    assert cal["B"] == {"band": "B", "loans": 25, "bad": 1, "predicted_pd": 0.01, "observed_bad_rate": 0.04,
                        "reliable": True}
    assert cal["D"]["reliable"] is False and cal["A"]["observed_bad_rate"] is None


def test_discrimination_perfect_random_and_one_class():
    perfect = [{"krs": 400 + i, "bad": i < 5} for i in range(50)]  # the five lowest scores are the bad ones
    d = metrics.discrimination(perfect)
    assert (d["auc"], d["gini"], d["ks"]) == (1.0, 1.0, 1.0)
    inverted = [{"krs": 400 + i, "bad": i >= 45} for i in range(50)]
    assert metrics.discrimination(inverted)["gini"] == -1.0
    tied = [{"krs": 520, "bad": i % 4 == 0} for i in range(40)]  # the score says nothing
    t = metrics.discrimination(tied)
    assert (t["auc"], t["gini"], t["ks"]) == (0.5, 0.0, 0.0)
    assert metrics.discrimination([{"krs": 500, "bad": False}] * 5)["gini"] is None


def test_discrimination_matches_a_brute_force_auc():
    rows = [{"krs": k, "bad": b} for k, b in zip([430, 480, 480, 520, 540, 560, 600, 610, 650, 700],
                                                  [1, 1, 0, 1, 0, 0, 0, 1, 0, 0], strict=True)]
    bad = [r["krs"] for r in rows if r["bad"]]
    good = [r["krs"] for r in rows if not r["bad"]]
    wins = sum((g > b) + 0.5 * (g == b) for b, g in itertools.product(bad, good))
    assert metrics.discrimination(rows)["auc"] == round(wins / (len(bad) * len(good)), 4)


def test_fairness_hides_small_cohorts_and_flags_a_gap_for_a_person_to_review():
    rows = [{"user_id": f"u{i}", "band": "B" if i % 2 else "D", "aura": 50, "eligible": i % 2 == 1} for i in range(60)]
    cohorts = {f"u{i}": ("year 1" if i < 30 else "year 2" if i < 55 else "year 4") for i in range(60)}
    out = metrics.fairness(rows, cohorts, min_cell=20, flag_below=0.8)
    assert [c["cohort"] for c in out["cohorts"]] == ["year 1", "year 2"] and out["hidden_small_cohorts"] == 1
    skewed = [{**r, "eligible": (r["eligible"] if cohorts[r["user_id"]] == "year 1" else False)} for r in rows]
    flagged = metrics.fairness(skewed, cohorts, min_cell=20, flag_below=0.8)
    assert flagged["flagged"] == ["year 2"] and "nothing changes automatically" in flagged["note"]
