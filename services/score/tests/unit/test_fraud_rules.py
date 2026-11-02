"""Every fraud and anti-gaming rule, with positive and negative cases. Thresholds come from the shipped YAML."""

from datetime import UTC, datetime, timedelta

import pytest
import yaml
from pydantic import ValidationError

from app.config.loader import DEFAULT_POLICY, build_config, load_config
from app.domain.enums import AlertRule
from app.fraud import rules
from app.scoring.engine import score
from tests.golden import personas as P

CFG = load_config()
F = CFG.policy.fraud
T = P.START + timedelta(days=5)


def found(p: P.Persona, rule: AlertRule | None = None) -> list[rules.Finding]:
    out = rules.per_student(p.records(), F)
    return [x for x in out if rule is None or x.rule == rule]


def signals(p: P.Persona, rule: AlertRule) -> list[str]:
    return [x.evidence["signal"] for x in found(p, rule)]


def with_loan(name: str, limit: int | None = P.LIMIT) -> tuple[P.Persona, str]:
    p = P.Persona(name).verify()
    return p, p.loan(T, amount=200_000, limit=limit, paid_after_days=None)


# farming ----------------------------------------------------------------------------------------------------------

def test_farming_fires_on_more_than_four_quick_repayments_in_30_days():
    hits = found(P.farhan(), AlertRule.FARMING)
    assert len(hits) == 2  # ten quick loans: two non-overlapping groups of five
    assert len(hits[0].evidence["loans"]) == F.farming.min_loans
    assert hits[0].key != hits[1].key and hits[0].user_id == P.farhan().user_id


def test_farming_needs_five_quick_loans():
    assert found(P.farhan(loans=4), AlertRule.FARMING) == []


def test_farming_ignores_quick_loans_spread_over_more_than_30_days():
    p = P.Persona("slow-farmer").verify()
    for i in range(6):
        p.loan(T + timedelta(days=10 * i), paid_after_days=1)
    assert found(p, AlertRule.FARMING) == []


def test_farming_ignores_loans_kept_longer_than_3_days():
    p = P.Persona("normal-borrower").verify()
    for i in range(6):
        p.loan(T + timedelta(days=5 * i), paid_after_days=4)
    assert found(p, AlertRule.FARMING) == []


# rollover chains --------------------------------------------------------------------------------------------------

def test_rollover_chain_fires_once_per_chain():
    hits = found(P.rahul(), AlertRule.ROLLOVER)
    assert len(hits) == 1 and hits[0].evidence["loans_in_chain"] == 6
    assert all(link["hours_after_previous_repaid"] == 3.0 for link in hits[0].evidence["links"])


def test_rollover_chain_needs_three_loans_in_a_row():
    p = P.Persona("two-in-a-row").verify()
    first = T
    p.loan(first, paid_after_days=10)
    p.loan(first + timedelta(days=10, hours=2), paid_after_days=10)
    p.loan(first + timedelta(days=25), paid_after_days=10)  # 3 days after repaying: breaks the chain
    assert found(p, AlertRule.ROLLOVER) == []


def test_rohan_monthly_loans_are_not_a_chain():
    assert found(P.rohan(), AlertRule.ROLLOVER) == []


# collusion --------------------------------------------------------------------------------------------------------

def test_collusion_pair_raises_on_the_student_and_the_vendor():
    p = P.collusion_pair()
    hits = found(p, AlertRule.COLLUSION)
    assert sorted(x.evidence["signal"] for x in hits) == ["refund_soon_after_spend", "same_amount_spends"]
    assert {(x.user_id, x.vendor_id) for x in hits} == {(p.user_id, P.uid(P.COLLUSION_VENDOR))}
    refund = next(x for x in hits if x.evidence["signal"] == "refund_soon_after_spend")
    assert refund.evidence["hours_between"] == pytest.approx(13.9, abs=0.1)


def test_same_amount_needs_three_spends_inside_a_week():
    p, lid = with_loan("spread-out")
    for d in (0, 4, 8):
        p.spend(lid, "cafe", 50_000, T + timedelta(days=d))
    assert found(p, AlertRule.COLLUSION) == []


def test_same_amount_allows_a_small_tolerance_only():
    near, lid = with_loan("near-same")
    for amount in (50_000, 51_000, 49_000):  # within 5%
        near.spend(lid, "cafe", amount, T + timedelta(hours=len(near.wire)))
    assert signals(near, AlertRule.COLLUSION) == ["same_amount_spends"]

    varied, lid = with_loan("varied")
    for amount in (50_000, 60_000, 40_000):
        varied.spend(lid, "cafe", amount, T + timedelta(hours=len(varied.wire)))
    assert found(varied, AlertRule.COLLUSION) == []


def test_same_amount_counts_one_vendor_at_a_time():
    p, lid = with_loan("three-shops")
    for i, shop in enumerate(("cafe", "printer", "canteen")):
        p.spend(lid, shop, 50_000, T + timedelta(hours=i))
    assert found(p, AlertRule.COLLUSION) == []


def test_spends_just_under_the_remaining_limit():
    p = P.Persona("maxer").verify()
    for i in range(2):
        lid = p.loan(T + timedelta(days=20 * i), amount=240_000, paid_after_days=None)
        p.spend(lid, "kiosk", 240_000, T + timedelta(days=20 * i, hours=1))  # 96% of ₹2,500
    assert signals(p, AlertRule.COLLUSION) == ["spends_just_under_limit"]

    once = P.Persona("maxed-once").verify()
    lid = once.loan(T, amount=240_000, paid_after_days=None)
    once.spend(lid, "kiosk", 240_000, T + timedelta(hours=1))
    assert found(once, AlertRule.COLLUSION) == []


def test_near_limit_needs_a_known_limit():
    p = P.Persona("no-limit").verify()
    for i in range(2):
        lid = p.loan(T + timedelta(days=20 * i), amount=240_000, limit=None, paid_after_days=None)
        p.spend(lid, "kiosk", 240_000, T + timedelta(days=20 * i, hours=1))
    assert found(p, AlertRule.COLLUSION) == []


def test_refund_after_48_hours_or_from_another_vendor_is_fine():
    late, lid = with_loan("late-refund")
    late.spend(lid, "cafe", 30_000, T).refund(lid, "cafe", 30_000, T + timedelta(hours=49))
    assert found(late, AlertRule.COLLUSION) == []

    other, lid = with_loan("other-refund")
    other.spend(lid, "cafe", 30_000, T).refund(lid, "bookshop", 30_000, T + timedelta(hours=2))
    assert found(other, AlertRule.COLLUSION) == []


# vendor anomaly ---------------------------------------------------------------------------------------------------

def _cycles(name: str, split: tuple[int, int]) -> P.Persona:
    p = P.Persona(name).verify()
    for i in range(3):
        lid = p.loan(T + timedelta(days=20 * i), paid_after_days=15)
        p.spend(lid, "canteen", split[0], T + timedelta(days=20 * i, hours=1))
        p.spend(lid, "bookshop", split[1], T + timedelta(days=20 * i, hours=2))
    return p


def test_one_vendor_over_60_percent_of_spend_across_3_cycles():
    hits = found(_cycles("one-shop", (70_000, 30_000)), AlertRule.VENDOR_ANOMALY)
    assert len(hits) == 1 and hits[0].vendor_id == P.uid("canteen") and hits[0].evidence["share"] == 0.7


def test_spread_spend_or_too_few_cycles_is_fine():
    assert found(_cycles("two-shops", (50_000, 50_000)), AlertRule.VENDOR_ANOMALY) == []
    p, lid = with_loan("one-cycle")
    p.spend(lid, "canteen", 90_000, T)
    assert found(p, AlertRule.VENDOR_ANOMALY) == []


@pytest.mark.parametrize(("this", "last", "fires"), [
    (400_000, 100_000, True),   # 4x
    (300_000, 100_000, False),  # exactly 3x is not "more than"
    (400_000, 0, False),        # no baseline yet
    (150_000, 10_000, False),   # below the minimum weekly volume
])
def test_vendor_surge(this, last, fires):
    week = rules.week_start(T)
    result = rules.vendor_surge(P.uid("kiosk"), week, this, last, T, F)
    assert (result is not None) == fires
    if fires:
        assert result.user_id is None and result.evidence["ratio"] == 4.0


def test_weeks_start_on_monday_in_india_time():
    sunday_night_utc = datetime(2026, 11, 1, 19, 0, tzinfo=UTC)  # Monday 00:30 IST
    assert rules.week_start(sunday_night_utc).isoformat() == "2026-11-02"


# velocity ---------------------------------------------------------------------------------------------------------

def _burst(name: str, n: int, every_minutes: float, campuses: tuple[str, ...] = ()) -> P.Persona:
    p, lid = with_loan(name)
    for i in range(n):
        campus = campuses[i % len(campuses)] if campuses else None
        p.spend(lid, f"stall-{i}", 5_000, T + timedelta(minutes=every_minutes * i), campus=campus)
    return p


def test_more_than_five_spends_in_ten_minutes():
    hits = found(_burst("speedy", 6, 1.5), AlertRule.VELOCITY)
    assert len(hits) == 1 and hits[0].evidence["spends_in_window"] == 6


def test_five_spends_or_a_slower_pace_is_fine():
    assert found(_burst("five", 5, 1), AlertRule.VELOCITY) == []
    assert found(_burst("slow", 6, 2.5), AlertRule.VELOCITY) == []  # 12.5 minutes end to end


def test_two_campuses_in_one_india_day():
    p, lid = with_loan("traveller")
    p.spend(lid, "a", 5_000, T, campus="north").spend(lid, "b", 5_000, T + timedelta(hours=3), campus="south")
    hits = found(p, AlertRule.VELOCITY)
    assert [h.evidence["signal"] for h in hits] == ["many_campuses_one_day"] and hits[0].evidence["campuses"] == 2


def test_campuses_on_different_india_days_or_one_campus_are_fine():
    p, lid = with_loan("night-owl")
    late = datetime(2026, 1, 10, 17, 0, tzinfo=UTC)  # 22:30 IST
    p.spend(lid, "a", 5_000, late, campus="north").spend(lid, "b", 5_000, late + timedelta(hours=2), campus="south")
    assert found(p, AlertRule.VELOCITY) == []
    assert found(_burst("home", 3, 60, campuses=("north",)), AlertRule.VELOCITY) == []


# rings ------------------------------------------------------------------------------------------------------------

def test_shared_identifier_flags_every_account():
    a, b = P.uid("ring-a"), P.uid("ring-b")
    hits = rules.ring("device", "ab" * 32, [(b, T + timedelta(days=1)), (a, T)])
    assert {h.user_id: h.evidence["linked_accounts"] for h in hits} == {a: [str(b)], b: [str(a)]}
    assert all(h.evidence["digest_prefix"] == "abababab" and h.key == "device:" + "ab" * 8 for h in hits)


def test_an_identifier_seen_once_is_fine():
    assert rules.ring("phone", "cd" * 32, [(P.uid("solo"), T)]) == []


# honest histories and inputs --------------------------------------------------------------------------------------

@pytest.mark.parametrize("persona", [P.aanya, P.rohan, P.meera, P.kabir])
def test_ordinary_personas_raise_nothing(persona):
    assert found(persona()) == []


def test_campus_never_changes_the_score():
    """campus_id feeds only the velocity rule; it must never be a scoring input."""
    with_campus, lid = with_loan("campus-a")
    without, lid2 = with_loan("campus-a")
    with_campus.spend(lid, "cafe", 10_000, T + timedelta(hours=1), campus="north")
    without.spend(lid2, "cafe", 10_000, T + timedelta(hours=1))
    as_of = T + timedelta(days=3)
    assert score(with_campus.records(), as_of, CFG).krs == score(without.records(), as_of, CFG).krs


# config rails -----------------------------------------------------------------------------------------------------

def _policy(edit) -> dict:
    pol = yaml.safe_load(DEFAULT_POLICY.read_text())
    edit(pol)
    return pol


def test_confirm_flag_must_be_a_knockout_flag():
    pol = _policy(lambda p: p["fraud"]["collusion"].update(confirm_flag="SOMETHING_ELSE"))
    with pytest.raises(ValidationError, match="confirm_flag must be one of the knockout flag types"):
        build_config(CFG.scorecard.model_dump(by_alias=True), pol)


def test_hold_flag_cannot_be_a_knockout():
    pol = _policy(lambda p: p["fraud"].update(hold_flag="FRAUD_CONFIRMED"))
    with pytest.raises(ValidationError, match="cannot be a knockout flag"):
        build_config(CFG.scorecard.model_dump(by_alias=True), pol)
