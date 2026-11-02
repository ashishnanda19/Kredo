"""Limit ladder rules, one or more cases each. Amounts and thresholds are read from the policy YAML."""

from datetime import UTC, datetime, timedelta

from hypothesis import HealthCheck, given, settings

from app.config.loader import load_config
from app.domain.enums import EventType
from app.scoring.engine import score
from tests.factories import uid
from tests.golden.personas import LIMIT, START, Persona
from tests.property.test_score_properties import build, scenarios

CFG = load_config()
LAD = CFG.policy.ladder
L = {lv.level: lv.limit_paise for lv in LAD.levels}


def day(n: float) -> datetime:
    return START + timedelta(days=n)


def reco(p: Persona, t: datetime) -> dict:
    return score(p.records(), t, CFG).limit_reco


def steady(name: str, loans: int, *, every: int = 30, paid_after: float = 15, amount: int = 100_000,
           limit: int | None = LIMIT) -> Persona:
    p = Persona(name).verify()
    for i in range(loans):
        p.loan(day(2 + every * i), paid_after_days=paid_after, amount=amount, limit=limit)
    return p


def test_verified_student_starts_at_l1_right_away():
    r = reco(Persona("new").verify(), START + timedelta(minutes=5))
    assert (r["level"], r["amount_paise"], r["eligible"], r["max_ticket_paise"]) == ("L1", L["L1"], True, L["L1"])
    assert r["next"]["cycles_needed"] == LAD.levels[1].cycles


def test_band_d_student_gets_no_limit():
    p = Persona("basic").verify(kyc="basic", phone=None)  # 500: band D
    r = reco(p, day(1))
    assert (r["level"], r["amount_paise"], r["eligible"], r["manual_review"]) == (None, 0, False, True)
    assert r["next"]["blockers"] == ["band"]


def test_two_clean_cycles_and_band_b_reach_l2():
    r = reco(steady("two", 3), day(2 + 60 + 16))
    assert r["level"] in ("L2", "L3")


def test_small_loans_are_not_clean_cycles():
    p = steady("tiny", 6, amount=int(LIMIT * 0.2))  # 20% of the limit
    r = reco(p, day(200))
    assert (r["level"], r["cycles_at_level"]) == ("L1", 0)


def test_loans_open_under_seven_days_are_not_clean_cycles():
    r = reco(steady("quick", 6, paid_after=5), day(200))
    assert (r["level"], r["cycles_at_level"]) == ("L1", 0)


def test_a_failed_payment_spoils_that_cycle():
    p = Persona("failed").verify()
    lid = p.loan(day(2), paid_after_days=15)
    p.add(EventType.PAYMENT_FAILED, day(10), {"loan_id": lid, "amount_paise": 50_000,
                                              "failure_class": "insufficient_funds", "rail": "upi"})
    p.loan(day(32), paid_after_days=15)
    assert reco(p, day(60))["cycles_at_level"] == 1


def test_technical_failures_do_not_spoil_a_cycle():
    p = Persona("tech").verify()
    lid = p.loan(day(2), paid_after_days=15)
    p.add(EventType.PAYMENT_FAILED, day(10), {"loan_id": lid, "amount_paise": 50_000, "failure_class": "technical",
                                              "rail": "upi"})
    assert reco(p, day(30))["cycles_at_level"] == 1


def test_at_most_one_step_up_per_30_days():
    # loans every 10 days, each open 8 days: cycles come faster than the ladder may climb
    p = steady("fast", 18, every=10, paid_after=8)
    levels, last_change, last = [], None, "L1"
    for n in range(1, 190):
        lvl = reco(p, day(n))["level"]
        if lvl != last:
            assert int(lvl[1]) == int(last[1]) + 1
            if last_change is not None:
                assert n - last_change >= LAD.step_up_min_days - 1
            last_change, last = n, lvl
        levels.append(lvl)
    assert last >= "L3"


def test_eight_days_past_due_drops_a_level_and_resets_cycles():
    p = steady("dropper", 6)
    before = reco(p, day(2 + 30 * 6))
    p.loan(day(2 + 30 * 6 + 1), term_days=20, paid_after_days=None)
    due = day(2 + 30 * 6 + 1 + 20)
    after = reco(p, due + timedelta(days=LAD.demote_at_dpd + 1))
    assert int(after["level"][1]) == int(before["level"][1]) - 1
    assert after["cycles_at_level"] == 0
    assert after["frozen"] is False


def test_31_days_past_due_freezes_until_cured_and_two_clean_cycles():
    p = Persona("freezer").verify()
    lid = p.loan(day(2), term_days=20, paid_after_days=None)
    assert reco(p, day(2 + 20 + 32))["frozen"] is True
    paid = day(70)
    p.add(EventType.REPAYMENT_RECEIVED, paid, {"loan_id": lid, "amount_paise": 100_000, "paid_at": paid.isoformat(),
                                               "rail": "upi"})
    assert reco(p, day(71))["frozen"] is True  # cured, but no clean cycles yet
    p.loan(day(75), paid_after_days=15)
    assert reco(p, day(95))["frozen"] is True
    p.loan(day(100), paid_after_days=15)
    assert reco(p, day(120))["frozen"] is False


def test_l4_needs_months_on_kredo():
    # many clean cycles quickly; L4 must still wait for 4 months on Kredo
    p = steady("young", 12, every=10, paid_after=8)
    for n in range(1, 125):
        r = reco(p, day(n))
        if r["level"] == "L4":
            assert n >= 4 * 30 - 5, n
            break


def _override(p: Persona, at: datetime, field: str, value: int, expires: datetime, oid: str = "o1") -> str:
    override_id = str(uid(f"{p.name}-{oid}"))
    p.add(EventType.OVERRIDE_APPROVED, at, {"override_id": override_id, "field": field, "value": value,
                                            "expires_at": expires.isoformat()})
    return override_id


def test_overrides_cap_pause_and_set_level_until_they_expire_or_are_revoked():
    p = steady("override", 6)
    base = reco(p, day(200))
    _override(p, day(200), "limit_cap_paise", 150_000, day(230), "cap")
    capped = reco(p, day(201))
    assert capped["amount_paise"] == 150_000 and capped["overrides"][0]["field"] == "limit_cap_paise"
    assert reco(p, day(231))["amount_paise"] == base["amount_paise"]  # expired

    pause = _override(p, day(240), "pause_new_loans", 1, day(260), "pause")
    paused = reco(p, day(241))
    assert (paused["eligible"], paused["action"], paused["max_ticket_paise"]) == (False, "paused_by_override", 0)
    p.add(EventType.OVERRIDE_REVOKED, day(242), {"override_id": pause})
    assert reco(p, day(243))["eligible"] is True

    _override(p, day(250), "ladder_level", 1, day(270), "level")
    assert reco(p, day(251))["level"] == "L1"


def test_overrides_never_change_krs():
    p = steady("krs-unchanged", 4)
    before = score(p.records(), day(150), CFG)
    _override(p, day(140), "pause_new_loans", 1, day(170))
    after = score(p.records(), day(150), CFG)
    assert (after.krs, after.band, after.aura) == (before.krs, before.band, before.aura)


def test_max_ticket_subtracts_what_is_owed():
    p = Persona("owing").verify()
    p.loan(day(1), paid_after_days=None, amount=40_000)
    r = reco(p, day(2))
    assert r["outstanding_paise"] == 40_000
    assert r["max_ticket_paise"] == L["L1"] - 40_000


@settings(max_examples=40, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(scenarios)
def test_ladder_climbs_one_level_at_a_time_and_never_while_frozen(s):
    p = build(s)
    prev = None
    for n in range(0, s.as_of_days, 7):
        r = reco(p, datetime.combine((START + timedelta(days=n)).date(), datetime.min.time(), UTC) + timedelta(hours=6))
        lvl = int(r["level"][1]) if r["level"] else 0
        if prev is not None:
            assert lvl <= prev[0] + 1
            if prev[1]:
                assert lvl <= prev[0], "promoted while frozen"
        prev = (lvl, r["frozen"])
