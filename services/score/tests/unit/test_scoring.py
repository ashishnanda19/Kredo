from datetime import timedelta

import pytest

from app.config.loader import load_config
from app.domain.enums import EventType
from app.scoring.aura import aura_from_krs
from app.scoring.calibration import band_for, implied_pd
from app.scoring.engine import score
from app.scoring.knockouts import KNOCKOUTS
from app.scoring.reasons import reason_codes
from app.scoring.scorecard import FactorScore
from tests.factories import uid
from tests.golden.personas import START, Persona

CFG = load_config()
CAL, POL = CFG.scorecard.calibration, CFG.policy


def day(n: float):
    return START + timedelta(days=n)


# calibration ---------------------------------------------------------------------------------------------------------

def test_krs_500_is_20_to_1():
    assert implied_pd(500, CAL) == pytest.approx(1 / 21)


def test_40_points_double_the_odds():
    odds = lambda k: (1 - implied_pd(k, CAL)) / implied_pd(k, CAL)  # noqa: E731
    assert odds(540) == pytest.approx(2 * odds(500))


# The brief's PD table is rounded (A "under 0.25%" starts at 0.22%), so edges are checked within 15%.
@pytest.mark.parametrize(("krs", "band", "spec_pd"), [(680, "A", 0.0025), (600, "B", 0.009), (520, "C", 0.034),
                                                      (440, "D", 0.12)])
def test_band_edges_match_the_implied_pd_table(krs, band, spec_pd):
    assert band_for(krs, POL).band == band
    assert band_for(krs - 1, POL).band == chr(ord(band) + 1)
    assert implied_pd(krs, CAL) == pytest.approx(spec_pd, rel=0.15)


# aura ----------------------------------------------------------------------------------------------------------------

@pytest.mark.parametrize(("krs", "aura"), [(0, 0), (400, 0), (403, 0), (404, 1), (519, 29), (520, 30), (599, 49),
                                           (600, 50), (679, 69), (680, 70), (740, 85), (800, 100), (1000, 100)])
def test_aura_is_a_straight_line_that_lands_on_band_edges(krs, aura):
    assert aura_from_krs(krs) == aura


def test_tier_follows_band_and_settlement_caps_it():
    p = Persona("settled-student").verify()
    for i in range(6):
        p.loan(day(2 + 30 * i), paid_after_days=15)
    lid = p.loan(day(200), paid_after_days=None)
    p.add(EventType.LOAN_CLOSED, day(260), {"loan_id": lid, "closure_type": "settled"})
    r = score(p.records(), day(262), CFG)
    assert r.tier in ("reset_arc", "side_quest")


# reason codes --------------------------------------------------------------------------------------------------------

def test_reason_codes_top_three_each_way_by_size():
    factors = [
        FactorScore("a", 0, "", {"ONTIME_STRONG": 80, "LATE_RECENT": -10}),
        FactorScore("b", 0, "", {"TRACK_RECORD": 40, "ROLLOVER": -50}),
        FactorScore("c", 0, "", {"ID_VERIFIED": 20, "EARLY_REPAY": 20, "STACKING": -15, "CREDIT_HUNGER": -25}),
    ]
    out = reason_codes(factors, thin_file=False)
    assert [c["code"] for c in out] == ["ONTIME_STRONG", "TRACK_RECORD", "EARLY_REPAY",
                                        "ROLLOVER", "CREDIT_HUNGER", "STACKING"]


def test_thin_file_code_is_neutral():
    out = reason_codes([], thin_file=True)
    assert out == [{"code": "THIN_FILE", "direction": "neutral", "points": 0}]


# knockouts -----------------------------------------------------------------------------------------------------------

def test_every_knockout_has_plain_text_and_a_way_out():
    for code, (message, way_out) in KNOCKOUTS.items():
        assert message.endswith(".") and way_out.endswith("."), code


def test_kyc_knockout_when_not_verified():
    p = Persona("no-kyc").verify(kyc="none")
    assert "KO_KYC" in score(p.records(), day(1), CFG).knockouts


def test_dpd90_knockout_lasts_twelve_months():
    p = Persona("very-late").verify()
    p.loan(day(1), term_days=20, paid_after_days=20 + 95)
    assert "KO_DPD90_12M" in score(p.records(), day(150), CFG).knockouts
    assert "KO_DPD90_12M" not in score(p.records(), day(21 + 90 + 366), CFG).knockouts


def test_written_off_knockout_is_permanent():
    p = Persona("written-off").verify()
    lid = p.loan(day(1), paid_after_days=None)
    p.add(EventType.LOAN_CLOSED, day(150), {"loan_id": lid, "closure_type": "written_off"})
    assert "KO_WRITTEN_OFF" in score(p.records(), day(1000), CFG).knockouts


@pytest.mark.parametrize(("flag", "code"), [("FRAUD_CONFIRMED", "KO_FRAUD"), ("DUPLICATE_IDENTITY", "KO_DUPLICATE")])
def test_flag_knockouts_set_and_clear(flag, code):
    p = Persona(f"flagged-{flag}").verify()
    actor = "0192f3c2-7d1e-7a4b-9c11-5e2f8a6b3d10"
    p.add(EventType.FRAUD_FLAG_SET, day(2), {"flag_type": flag, "reason": "ops check", "actor_id": actor})
    assert code in score(p.records(), day(3), CFG).knockouts
    p.add(EventType.FRAUD_FLAG_CLEARED, day(4), {"flag_type": flag, "reason": "resolved", "actor_id": actor})
    assert code not in score(p.records(), day(5), CFG).knockouts


def test_hold_flag_pauses_lending_without_a_knockout():
    p = Persona("held").verify()
    actor, alert = str(uid("ops-actor")), str(uid("alert-1"))
    hold = {"flag_type": CFG.policy.fraud.hold_flag, "reason": "velocity", "actor_id": actor}
    p.add(EventType.FRAUD_FLAG_SET, day(2), {**hold, "ref": alert})
    held = score(p.records(), day(3), CFG)
    assert held.knockouts == [] and held.limit_reco["held_for_review"] is True
    assert (held.limit_reco["eligible"], held.limit_reco["action"]) == (False, "held_for_review")
    assert held.krs == score(p.records()[:-1], day(3), CFG).krs  # a hold never moves KRS

    # flags pair up on (type, ref): a clear without the alert's ref leaves the alert's hold in place
    p.add(EventType.FRAUD_FLAG_CLEARED, day(4), hold)
    assert score(p.records(), day(5), CFG).limit_reco["held_for_review"] is True
    p.add(EventType.FRAUD_FLAG_CLEARED, day(6), {**hold, "ref": alert})
    released = score(p.records(), day(7), CFG).limit_reco
    assert (released["held_for_review"], released["eligible"]) == (False, True)


def test_withdrawn_consent_freezes_the_score():
    p = Persona("consent").verify()
    p.loan(day(1), paid_after_days=15)
    p.add(EventType.CONSENT_CHANGED, day(20), {"purpose": "scoring", "granted": False, "text_version": "v1"})
    p.loan(day(30), paid_after_days=None)  # would be overdue later, but the score is frozen at withdrawal
    frozen = score(p.records(), day(100), CFG)
    assert "KO_CONSENT" in frozen.knockouts
    assert frozen.evaluated_at == day(20)
    assert frozen.krs == score(p.records()[:-1], day(20), CFG).krs
