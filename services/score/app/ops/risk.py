"""Data for the ops risk console: the risk list, one user's full picture, and the monitoring overview.

The shaping functions are pure (dicts in, dicts out), so the web app's mock fixtures are built with the same code
from engine results (`app/devtools/export_fixtures.py`). Ops may see KRS, PD, band and points; identifiers are
masked in the UI by default.
"""

from collections import Counter
from datetime import date, datetime
from typing import Any

from app.domain.dpd import days_past_due, ist_date
from app.domain.enums import AlertStatus
from app.scoring.engine import ScoreResult
from app.scoring.knockouts import KNOCKOUTS


def _iso(t: datetime | None) -> str | None:
    return t.isoformat() if t else None


# snapshots ----------------------------------------------------------------------------------------------------------

def snapshot_from_row(s) -> dict[str, Any]:
    """A stored ScoreSnapshot as the console sees it."""
    return {
        "id": str(s.id), "as_of": s.as_of.isoformat(),
        "evaluated_at": (s.features or {}).get("evaluated_at", s.as_of.isoformat()),
        "krs": s.krs, "pd": s.pd, "band": s.band, "aura": s.aura, "tier": s.tier, "fresh_spawn": s.fresh_spawn,
        "streak": s.streak, "reason_codes": s.reason_codes, "knockouts": s.knockouts, "limit_reco": s.limit_reco or {},
        "points": s.points, "features": {k: v for k, v in (s.features or {}).items() if k != "evaluated_at"},
        "versions": {"scorecard": s.scorecard_version, "policy": s.policy_version, "config_hash": s.config_hash},
        "trigger_event_id": str(s.trigger_event_id) if s.trigger_event_id else None,
    }


def snapshot_from_result(r: ScoreResult, base_score: int, snapshot_id: str, trigger: str | None = None) -> dict:
    """The same shape from an engine result (for the mock fixtures)."""
    return {
        "id": snapshot_id, "as_of": r.as_of.isoformat(), "evaluated_at": r.evaluated_at.isoformat(), "krs": r.krs,
        "pd": r.pd, "band": r.band, "aura": r.aura, "tier": r.tier, "fresh_spawn": r.fresh_spawn, "streak": r.streak,
        "reason_codes": r.reason_codes, "knockouts": r.knockouts, "limit_reco": r.limit_reco,
        "points": r.points_json(base_score), "features": r.features,
        "versions": {"scorecard": r.scorecard_version, "policy": r.policy_version, "config_hash": r.config_hash},
        "trigger_event_id": trigger,
    }


def with_diffs(snaps: list[dict]) -> list[dict]:
    """Newest first, each with what changed since the one before it: KRS, band, tier, level, knockouts, and every
    factor whose points moved."""
    ordered = sorted(snaps, key=lambda s: (s["as_of"], s["id"]))
    out = []
    for prev, cur in zip([None, *ordered], ordered, strict=False):
        diff: dict[str, Any] = {}
        if prev is not None:
            diff["krs"] = cur["krs"] - prev["krs"]
            for k in ("band", "tier"):
                if cur[k] != prev[k]:
                    diff[k] = [prev[k], cur[k]]
            levels = [(prev["limit_reco"] or {}).get("level"), (cur["limit_reco"] or {}).get("level")]
            if levels[0] != levels[1]:
                diff["level"] = levels
            added = sorted(set(cur["knockouts"]) - set(prev["knockouts"]))
            lifted = sorted(set(prev["knockouts"]) - set(cur["knockouts"]))
            if added or lifted:
                diff["knockouts"] = {"added": added, "lifted": lifted}
            pf, cf = prev["points"]["factors"], cur["points"]["factors"]
            moved = {f: [pf.get(f, {}).get("points", 0), v["points"]] for f, v in cf.items()
                     if pf.get(f, {}).get("points", 0) != v["points"]}
            if moved:
                diff["factors"] = moved
        out.append({"id": cur["id"], "as_of": cur["as_of"], "krs": cur["krs"], "band": cur["band"], "aura": cur["aura"],
                    "tier": cur["tier"], "level": (cur["limit_reco"] or {}).get("level"),
                    "knockouts": cur["knockouts"], "trigger_event_id": cur["trigger_event_id"], "diff": diff})
    return list(reversed(out))


def event_item(event_id, type_: str, occurred_at: datetime, source: str, synthetic: bool, payload: dict) -> dict:
    return {"event_id": str(event_id), "type": type_, "occurred_at": occurred_at.isoformat(), "source": source,
            "synthetic": synthetic, "payload": payload}


def row(latest: dict, *, user_id: str, synthetic: bool, open_alerts: int) -> dict:
    reco = latest["limit_reco"] or {}
    return {"user_id": user_id, "as_of": latest["as_of"], "krs": latest["krs"], "pd": latest["pd"],
            "band": latest["band"], "aura": latest["aura"], "tier": latest["tier"], "knockouts": latest["knockouts"],
            "level": reco.get("level"), "eligible": reco.get("eligible", False),
            "held_for_review": reco.get("held_for_review", False), "open_alerts": open_alerts,
            "synthetic": synthetic}


def detail(user_id: str, latest: dict, snaps: list[dict], events: list[dict], ladder: dict | None,
           alerts: list[dict], overrides: list[dict], synthetic: bool) -> dict:
    return {
        "user_id": user_id, "synthetic": synthetic, "latest": latest,
        "knockouts": [{"code": k, "message": KNOCKOUTS[k][0], "way_out": KNOCKOUTS[k][1]}
                      for k in latest["knockouts"] if k in KNOCKOUTS],
        "ladder": ladder, "snapshots": with_diffs(snaps), "events": sorted(events, key=lambda e: e["occurred_at"],
                                                                            reverse=True),
        "alerts": alerts, "overrides": overrides,
    }


# monitoring -----------------------------------------------------------------------------------------------------------

def loan_dpd_reached(due: date, cleared: datetime | None, today: date) -> int:
    """The highest DPD a loan has reached: DPD only grows until the loan is cleared, so it is the DPD at clearing,
    or today's for a loan still open."""
    return days_past_due(due, today, ist_date(cleared) if cleared else None)


def summarise(latest: list[dict], loans: list[dict], decisions: list[dict], alerts: list[dict], *, now: datetime,
              last_event_at: datetime | None, synthetic_users: int) -> dict:
    """The overview numbers (model health, which reads the labelled outcomes, is added by app/monitoring/service.py).
    `latest`: each user's latest snapshot; `loans`: due_date, cleared_at, closure_type; `decisions`: kind, eligible,
    partner_decision, agreement; `alerts`: rule, severity, status."""
    today = ist_date(now)
    bands = Counter(s["band"] for s in latest)
    hist = Counter(min(s["aura"] // 10, 9) for s in latest)
    stages = [("current", "1-7", 1), ("1-7", "8-30", 8), ("8-30", "31+", 31)]
    matured = [x for x in loans if x["due_date"] and x["due_date"] < today]
    reached = [loan_dpd_reached(x["due_date"], x["cleared_at"], today) for x in matured]
    base = len(matured)
    roll = []
    for frm, to, dpd in stages:
        hit = sum(r >= dpd for r in reached)
        rate = round(hit / base, 4) if base else None
        roll.append({"from": frm, "to": to, "base": base, "reached": hit, "rate": rate})
        base = hit

    prechecks = [d for d in decisions if d["kind"] == "precheck"]
    outcomes = [d for d in decisions if d["kind"] == "outcome"]
    resolved = [a for a in alerts if a["status"] != AlertStatus.OPEN]
    confirmed = Counter(a["rule"] for a in resolved if a["status"] in ("confirmed", "lift_pending", "lifted"))
    resolved_by_rule = Counter(a["rule"] for a in resolved)
    return {
        "as_of": now.isoformat(),
        "users": len(latest),
        "synthetic_users": synthetic_users,
        "bands": {b: bands.get(b, 0) for b in "ABCDE"},
        "aura_histogram": [{"from": i * 10, "to": 100 if i == 9 else i * 10 + 9, "count": hist.get(i, 0)}
                           for i in range(10)],
        "tiers": dict(Counter(s["tier"] for s in latest)),
        "knockouts": dict(Counter(k for s in latest for k in s["knockouts"])),
        "eligible_now": sum(bool((s["limit_reco"] or {}).get("eligible")) for s in latest),
        "approval": {
            "prechecks": len(prechecks),
            "precheck_eligible_rate": round(sum(bool(d["eligible"]) for d in prechecks) / len(prechecks), 4)
            if prechecks else None,
            "outcomes": len(outcomes),
            "approval_rate": round(sum(d["partner_decision"] == "approved" for d in outcomes) / len(outcomes), 4)
            if outcomes else None,
            "agreement": dict(Counter(d["agreement"] for d in outcomes if d.get("agreement"))),
        },
        "dpd_roll": {"matured_loans": len(matured), "stages": roll},
        "alerts": {
            "open": sum(a["status"] == AlertStatus.OPEN for a in alerts),
            "open_by_rule": dict(Counter(a["rule"] for a in alerts if a["status"] == AlertStatus.OPEN)),
            "open_by_severity": dict(Counter(a["severity"] for a in alerts if a["status"] == AlertStatus.OPEN)),
            "confirm_rate_by_rule": {r: round(confirmed[r] / n, 4) for r, n in resolved_by_rule.items()},
        },
        "freshness_minutes": round((now - last_event_at).total_seconds() / 60, 1) if last_event_at else None,
    }
