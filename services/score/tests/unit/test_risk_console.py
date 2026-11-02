"""The ops console's pure shaping: snapshot diffs and the monitoring summary."""

from datetime import UTC, date, datetime, timedelta

from app.config.loader import load_config
from app.ops import risk
from app.scoring.engine import score
from tests.golden import personas as P

CFG = load_config()
NOW = datetime(2026, 10, 30, 6, 30, tzinfo=UTC)


def test_snapshot_diffs_name_what_moved():
    events = P.meera().records()
    times = [P.START + timedelta(days=d) for d in (40, 90, 120)]
    snaps = [risk.snapshot_from_result(score(events, t, CFG), 500, f"s{i}") for i, t in enumerate(times)]
    out = risk.with_diffs(snaps)
    assert [x["id"] for x in out] == ["s2", "s1", "s0"]  # newest first
    assert out[-1]["diff"] == {}
    for newer, older in zip(out, out[1:], strict=False):
        assert newer["diff"]["krs"] == newer["krs"] - older["krs"]
    # the 12-days-late loan shows up as factor points moving between the first two snapshots
    assert out[1]["diff"]["factors"]
    assert all(before != after for before, after in out[1]["diff"]["factors"].values())


def test_dpd_reached_stops_when_the_loan_is_cleared():
    due = date(2026, 9, 1)
    assert risk.loan_dpd_reached(due, None, date(2026, 9, 11)) == 10
    assert risk.loan_dpd_reached(due, datetime(2026, 9, 5, 6, tzinfo=UTC), date(2026, 10, 30)) == 4
    assert risk.loan_dpd_reached(due, datetime(2026, 8, 30, tzinfo=UTC), date(2026, 10, 30)) == 0


def _snap(band, aura, kos=(), eligible=True):
    return {"band": band, "aura": aura, "tier": "side_quest", "knockouts": list(kos),
            "limit_reco": {"eligible": eligible}}


def test_summary_counts_bands_rolls_and_alerts():
    today = date(2026, 10, 30)

    def repaid(due_days_ago, days_late):
        due = today - timedelta(days=due_days_ago)
        at = datetime.combine(due + timedelta(days=days_late), datetime.min.time(), UTC) + timedelta(hours=6)
        return {"due_date": due, "cleared_at": at, "closure_type": "repaid"}

    loans = [
        repaid(100, 0),
        repaid(90, 5),
        repaid(80, 15),
        {"due_date": today - timedelta(days=70), "cleared_at": None, "closure_type": None},  # still open: 70 DPD
        {"due_date": today - timedelta(days=10), "cleared_at": None, "closure_type": None},  # 10 DPD, not labelled yet
        {"due_date": today + timedelta(days=5), "cleared_at": None, "closure_type": None},  # not due
    ]
    decisions = [{"kind": "precheck", "eligible": True, "partner_decision": None, "agreement": None},
                 {"kind": "precheck", "eligible": False, "partner_decision": None, "agreement": None},
                 {"kind": "outcome", "eligible": None, "partner_decision": "approved", "agreement": "match"}]
    alerts = [{"rule": "COLLUSION", "severity": "high", "status": "open"},
              {"rule": "FARMING", "severity": "low", "status": "dismissed"},
              {"rule": "FARMING", "severity": "low", "status": "confirmed"}]
    out = risk.summarise([_snap("A", 75), _snap("C", 30), _snap("E", 0, ["KO_OVERDUE_30"], False)], loans, decisions,
                         alerts, now=NOW, last_event_at=NOW - timedelta(minutes=12), synthetic_users=3)
    assert out["bands"] == {"A": 1, "B": 0, "C": 1, "D": 0, "E": 1}
    assert sum(b["count"] for b in out["aura_histogram"]) == 3 and out["aura_histogram"][7]["count"] == 1
    assert [(s["base"], s["reached"]) for s in out["dpd_roll"]["stages"]] == [(5, 4), (4, 3), (3, 1)]
    assert out["approval"]["precheck_eligible_rate"] == 0.5 and out["approval"]["approval_rate"] == 1.0
    assert out["alerts"]["open"] == 1 and out["alerts"]["confirm_rate_by_rule"] == {"FARMING": 0.5}
    assert out["knockouts"] == {"KO_OVERDUE_30": 1} and out["eligible_now"] == 2
    assert out["freshness_minutes"] == 12.0
