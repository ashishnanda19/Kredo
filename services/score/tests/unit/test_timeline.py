"""The Aura timeline, the what-if simulator, the demo presets and the exported web fixtures."""

import json
from datetime import timedelta

import pytest

from app.config.loader import load_config
from app.devtools import export_fixtures, presets
from app.events.schemas import EventBatch
from app.scoring import timeline
from app.scoring.aura import aura_from_krs
from app.scoring.engine import score
from tests.golden import personas as P

CFG = load_config()
END = P.START + timedelta(days=200)


def test_timeline_series_ends_on_the_current_aura_and_marks_what_moved_it():
    events = P.rohan().records()
    r = score(events, END, CFG)
    h = timeline.history(events, r, P.START.date(), END.date(), CFG)
    assert h["days"][-1] == {"date": END.date().isoformat(), "aura": r.aura}
    assert all(0 <= d["aura"] <= 100 for d in h["days"])
    kinds = [m["kind"] for m in h["markers"]]
    assert kinds.count("repaid_early") + kinds.count("repaid_on_time") == 6
    assert "level_up" in kinds and "repaid_late" not in kinds
    assert [m["level"] for m in h["markers"] if m["kind"] == "level_up"][-1] == r.limit_reco["level"]


def test_timeline_matches_the_capped_daily_score():
    events = P.farhan().records()
    r = score(events, END, CFG)
    h = timeline.history(events, r, P.START.date(), END.date(), CFG)
    assert [d["aura"] for d in h["days"][:-1]] == [aura_from_krs(d.krs) for d in r.daily if d.day >= P.START.date()]


def test_timeline_shows_late_repayments_and_demotions():
    events = P.meera().records()
    h = timeline.history(events, score(events, END, CFG), P.START.date(), END.date(), CFG)
    kinds = [m["kind"] for m in h["markers"]]
    assert "repaid_late" in kinds and "level_down" in kinds


def _open_loan_persona():
    p = P.Persona("what-if").verify()
    for i in range(2):
        p.loan(P.START + timedelta(days=2 + 30 * i), paid_after_days=18)
    lid = p.loan(P.START + timedelta(days=62), paid_after_days=None)
    return p, lid


def _repay(lid, at):
    return [{"type": "repayment_received", "occurred_at": at,
             "payload": {"loan_id": lid, "amount_paise": P.AMOUNT, "paid_at": at.isoformat(), "rail": "upi"}}]


def test_what_if_never_changes_the_real_history_and_rewards_repaying_earlier():
    p, lid = _open_loan_persona()
    events = p.records()
    now = P.START + timedelta(days=64)
    due = P.START + timedelta(days=82)
    horizon = due + timedelta(days=2)
    results = [timeline.simulate(events, timeline.hypothetical(events, _repay(lid, due - timedelta(days=d))), now,
                                 CFG, horizon) for d in (0, 2, 5)]
    assert [r["at"] for r in results] == [horizon.isoformat()] * 3  # compared at one moment
    projected = [r["projected"]["aura"] for r in results]
    assert projected == sorted(projected) and projected[-1] >= projected[0]
    assert all(r["current"]["aura"] == score(events, now, CFG).aura for r in results)
    assert len(events) == len(p.records())  # nothing was added to the real list


def test_hypothetical_ids_are_stable():
    p, lid = _open_loan_persona()
    events = p.records()
    at = P.START + timedelta(days=70)
    assert timeline.hypothetical(events, _repay(lid, at)) == timeline.hypothetical(events, _repay(lid, at))


@pytest.mark.parametrize("name", list(presets.PRESETS))
def test_every_preset_is_valid_fake_data(name):
    wire = presets.build(name, presets.fixture_user(name), export_fixtures.AS_OF)
    EventBatch.model_validate({"events": wire})
    assert all(w["synthetic"] and w["source"] == "demo_controls" for w in wire)


EXPECTED = {  # the Aura state each preset exists to show
    "fresh_spawn": lambda s: s["fresh_spawn"] and not s["knockouts"],
    "locked_in_streak": lambda s: s["tier"] == "locked_in" and s["streak"] >= 2,
    "late_payer_recovering": lambda s: not s["knockouts"] and any(r["code"] == "LATE_RECENT"
                                                                  for r in s["reason_codes"]),
    "knockout_overdue_35": lambda s: "KO_OVERDUE_30" in s["knockouts"],
    "collusion_alert": lambda s: not s["knockouts"],  # an open alert is not a knockout
    "held_for_review": lambda s: s["limit_reco"]["held_for_review"] and not s["limit_reco"]["eligible"],
    "consent_frozen": lambda s: s["knockouts"] == ["KO_CONSENT"],
}


def test_fixtures_show_each_state_and_carry_no_internal_fields():
    built = export_fixtures.build(CFG)
    assert set(built["presets"]) == set(presets.PRESETS) == set(EXPECTED)
    for name, fx in built["presets"].items():
        assert EXPECTED[name](fx["score"]), name

    def keys(x):
        if isinstance(x, dict):
            for k, v in x.items():
                yield k
                yield from keys(v)
        elif isinstance(x, list):
            for v in x:
                yield from keys(v)

    assert not {"krs", "pd", "band", "points"} & set(keys(built))


def test_committed_fixtures_are_up_to_date():
    """lib/score/fixtures.json must be regenerated (make fixtures) whenever the engine, config or presets change."""
    committed = json.loads(export_fixtures.OUT.read_text())
    assert committed == json.loads(json.dumps(export_fixtures.build(CFG))), "run `make fixtures`"


def test_committed_ops_fixtures_are_up_to_date():
    committed = json.loads(export_fixtures.OPS_OUT.read_text())
    assert committed == json.loads(json.dumps(export_fixtures.build_ops(CFG), default=str)), "run `make fixtures`"
