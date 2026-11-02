"""Golden personas. Expected values are computed from the YAML wherever possible, so retuning points does not need
these tests rewritten, but changing behaviour does. The limit level (L1...) is asserted in phase 3, and the FARMING
and COLLUSION alerts in phase 4.
"""

from datetime import timedelta

from app.config.loader import load_config
from app.domain.enums import AlertRule
from app.features.history import History
from app.fraud import rules
from app.scoring.aura import aura_from_krs
from app.scoring.calibration import band_for
from app.scoring.engine import capped_series, score
from tests.golden import personas as P

CFG = load_config()
SC, POL = CFG.scorecard, CFG.policy
END = P.START + timedelta(days=200)


def codes(result, direction=None) -> set[str]:
    return {c["code"] for c in result.reason_codes if direction is None or c["direction"] == direction}


def test_fresh_spawn_aanya():
    r = score(P.aanya().records(), P.START + timedelta(days=1), CFG)
    expected = SC.calibration.base_score + SC.factors.f10_identity.full_verification
    assert r.krs == expected == 520
    assert r.aura == aura_from_krs(expected) == 30
    assert r.band == band_for(expected, POL).band == "C"
    assert r.tier == "side_quest"
    assert r.fresh_spawn
    assert codes(r) == {"ID_VERIFIED", "THIN_FILE"}
    assert r.knockouts == []
    level_1 = POL.ladder.levels[0]
    assert (r.limit_reco["level"], r.limit_reco["amount_paise"], r.limit_reco["eligible"]) == (
        "L1", level_1.limit_paise, True)


def test_steady_rohan_reaches_band_a():
    r = score(P.rohan().records(), END, CFG)
    assert r.band == "A"
    assert r.krs >= POL.bands[0].min_krs
    assert r.streak == 6
    assert not codes(r, "down")
    assert {"ONTIME_STRONG", "EARLY_REPAY", "TRACK_RECORD"} <= codes(r, "up")


def test_recovering_meera_is_below_rohan_and_rises_each_clean_cycle():
    rohan = score(P.rohan().records(), END, CFG)
    meera = score(P.meera().records(), END, CFG)
    assert meera.krs < rohan.krs
    assert "LATE_RECENT" in codes(meera, "down")
    assert "ONTIME_STRONG" not in codes(meera), "never tell a student who paid late that they paid on time"
    # score just after each extra clean loan closes
    trail = [score(P.meera(clean_after=k).records(), P.START + timedelta(days=2 + 30 * (5 + k) + 20), CFG).krs
             for k in range(5)]
    # A points table moves in steps, so a cycle that crosses no bin edge leaves the score flat. Each clean cycle never
    # lowers it, and four of them must lift it by at least one full bin.
    assert all(b >= a for a, b in zip(trail, trail[1:], strict=False)), trail
    assert trail[-1] - trail[0] >= 40, trail


def test_rollover_rahul_is_at_least_50_below_rohan():
    rohan = score(P.rohan().records(), END, CFG)
    rahul = score(P.rahul().records(), END, CFG)
    assert rahul.krs <= rohan.krs - 50
    assert "ROLLOVER" in codes(rahul, "down")


def test_paying_an_overdue_loan_helps_right_away():
    """OVERDUE_NOW tells the student "Paying it helps right away", so the cap must not throttle that recovery."""
    p = P.Persona("cured-student").verify()
    lid = p.loan(P.START + timedelta(days=2), term_days=20, paid_after_days=None)
    paid = P.START + timedelta(days=2 + 20 + 25)
    before = score(p.records(), paid - timedelta(hours=1), CFG)
    p.add(P.EventType.REPAYMENT_RECEIVED, paid, {"loan_id": lid, "amount_paise": P.AMOUNT,
                                                 "paid_at": paid.isoformat(), "rail": "upi"})
    after = score(p.records(), paid + timedelta(hours=1), CFG)
    overdue_points = -next(f.points for f in before.factors if f.factor == "f3_current_overdue")
    assert after.krs - before.krs >= overdue_points > SC.velocity_cap.max_rise


def test_overdue_kabir_is_knocked_out_with_plain_codes():
    r = score(P.kabir().records(), P.START + timedelta(days=2 + 20 + 35), CFG)
    assert "KO_OVERDUE_30" in r.knockouts
    assert "OVERDUE_NOW" in codes(r, "down")
    assert r.tier == "reset_arc"
    assert r.band_action == "paused"
    assert (r.limit_reco["eligible"], r.limit_reco["max_ticket_paise"], r.limit_reco["frozen"]) == (False, 0, True)


def test_farmer_farhan_rises_at_most_60_in_30_days():
    p = P.farhan()
    first_loan = P.START + timedelta(days=30)
    r = score(p.records(), first_loan + timedelta(days=15), CFG)
    assert r.raw_krs > r.krs, "the uncapped score should outrun the cap"
    assert r.krs - 520 <= SC.velocity_cap.max_rise
    series = [d.krs for d in capped_series(History.build(p.records()), P.START + timedelta(days=120), CFG)]
    for i, k in enumerate(series):
        assert k - min(series[max(0, i - 30):i] or [k]) <= SC.velocity_cap.max_rise
    # quick repays count a quarter in the track record
    assert r.features["f9_closed_weighted"] == SC.quick_repay.weight * 10
    # and the farming pattern goes to the ops queue (low severity: the scorecard has already discounted it)
    farming = [x for x in rules.per_student(p.records(), CFG.policy.fraud) if x.rule == AlertRule.FARMING]
    assert farming and all(len(x.evidence["loans"]) > 4 for x in farming)


def test_collusion_pair_raises_collusion_on_the_student_and_the_vendor():
    p = P.collusion_pair()
    found = rules.per_student(p.records(), CFG.policy.fraud)
    assert {x.rule for x in found} == {AlertRule.COLLUSION}
    assert {(x.user_id, x.vendor_id) for x in found} == {(p.user_id, P.uid(P.COLLUSION_VENDOR))}
    assert {x.evidence["signal"] for x in found} == {"same_amount_spends", "refund_soon_after_spend"}
    # an alert is not a knockout: only an ops-confirmed alert pauses lending
    assert "KO_FRAUD" not in score(p.records(), END, CFG).knockouts
