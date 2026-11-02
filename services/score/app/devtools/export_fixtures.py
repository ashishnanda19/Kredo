"""Writes the web app's mock-mode data from the real engine: lib/score/fixtures.json (student Aura) and
lib/score/ops-fixtures.json (the ops risk console, which may show KRS and points; it loads only on /ops/risk).

Each demo preset is scored, its Aura history built and a few what-ifs simulated, exactly as the API would. The fraud
step's hold is replayed the way the consumer writes it. Internal fields (krs, pd, band, reason-code points) are
removed before writing, because this file ships in the browser bundle. Run `make fixtures` after changing the
scorecard, the policy or a preset.

    uv run python -m app.devtools.export_fixtures [path]
"""

import json
import sys
from datetime import UTC, datetime, time, timedelta
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from app.config.loader import DEFAULT_POLICY, DEFAULT_SCORECARD, EngineConfig, load_config
from app.devtools import presets
from app.domain.dpd import IST
from app.domain.enums import EventType
from app.domain.records import EventRecord
from app.events.schemas import EventBatch
from app.features.history import History
from app.fraud import rules
from app.monitoring import service as monitoring_service
from app.monitoring.outcomes import outcome_row
from app.ops import risk
from app.scoring import timeline
from app.scoring.engine import score

# matches MOCK_TODAY in lib/format.ts (30 Oct 2026), at noon India time
AS_OF = datetime(2026, 10, 30, 12, 0, tzinfo=IST)
OUT = Path(__file__).resolve().parents[4] / "lib" / "score" / "fixtures.json"
INTERNAL = ("krs", "pd", "band")
WHAT_IF_DAYS_EARLY = (0, 1, 2, 3, 5)


def _records(wire: list[dict]) -> list[EventRecord]:
    batch = EventBatch.model_validate({"events": wire})
    return [EventRecord(e.event_id, EventType(e.type), e.user_id, e.occurred_at, e.payload.model_dump(mode="json"),
                        e.synthetic) for e in batch.events]


def _with_holds(events: list[EventRecord], cfg: EngineConfig) -> list[EventRecord]:
    """What the consumer adds: a hold flag when a holding alert (velocity) opens."""
    f = cfg.policy.fraud
    out = list(events)
    for x in rules.per_student(events, f):
        if getattr(f.rule(x.rule.value), "hold", False):
            ref = uuid5(NAMESPACE_URL, f"kredo-fixture-alert:{x.user_id}:{x.rule}")
            out.append(EventRecord(uuid5(NAMESPACE_URL, f"{ref}:hold"), EventType.FRAUD_FLAG_SET, x.user_id, x.at,
                                   {"flag_type": f.hold_flag, "reason": "held for review",
                                    "actor_id": str(ref), "ref": str(ref)}, True))
            break
    return out


def _safe(view: dict[str, Any]) -> dict[str, Any]:
    out = {k: v for k, v in view.items() if k not in INTERNAL}
    out["reason_codes"] = [{"code": r["code"], "direction": r["direction"]} for r in view["reason_codes"]]
    return out


def _what_ifs(events: list[EventRecord], result, cfg: EngineConfig) -> list[dict[str, Any]]:
    loans = result.limit_reco["open_loans"]
    if not loans or result.knockouts:
        return []
    loan = loans[0]
    due = datetime.fromisoformat(loan["due_date"]).date()
    horizon = datetime.combine(due + timedelta(days=cfg.policy.repayment.grace_days + 1), time(23, 59), IST)
    out = []
    for days in WHAT_IF_DAYS_EARLY:
        at = max(datetime.combine(due - timedelta(days=days), time(12), IST), AS_OF + timedelta(minutes=5))
        spec = [{"type": "repayment_received", "occurred_at": at,
                 "payload": {"loan_id": loan["loan_id"], "amount_paise": loan["outstanding_paise"],
                             "paid_at": at.isoformat(), "rail": "upi"}},
                {"type": "loan_closed", "occurred_at": at + timedelta(minutes=1),
                 "payload": {"loan_id": loan["loan_id"], "closure_type": "repaid"}}]
        sim = timeline.simulate(events, timeline.hypothetical(events, spec), AS_OF, cfg, horizon)
        out.append({"days_early": days, "loan_id": loan["loan_id"], "amount_paise": loan["outstanding_paise"],
                    "result": {**sim, "current": _safe(sim["current"]), "projected": _safe(sim["projected"])}})
    return out


def build(cfg: EngineConfig) -> dict[str, Any]:
    levels = [{"level": x.level, "amount_paise": x.limit_paise} for x in cfg.policy.ladder.levels]
    out: dict[str, Any] = {}
    for name in presets.PRESETS:
        user = presets.fixture_user(name)
        events = _with_holds(_records(presets.build(name, user, AS_OF)), cfg)
        r = score(events, AS_OF, cfg)
        view = {"user_id": str(user), "snapshot_id": str(uuid5(NAMESPACE_URL, f"kredo-fixture-snap:{name}")),
                "as_of": AS_OF.isoformat(), "evaluated_at": r.evaluated_at.isoformat(), "aura": r.aura,
                "tier": r.tier, "fresh_spawn": r.fresh_spawn, "streak": r.streak, "reason_codes": r.reason_codes,
                "knockouts": r.knockouts,
                "limit_reco": r.limit_reco, "versions": {"scorecard": r.scorecard_version, "policy": r.policy_version,
                                                         "config_hash": r.config_hash},
                "ladder_levels": levels}
        start = AS_OF.date() - timedelta(days=180)
        out[name] = {"score": _safe(view), "history": timeline.history(events, r, start, AS_OF.date(), cfg),
                     "what_ifs": _what_ifs(events, r, cfg)}
    return {"_note": "Generated by services/score (make fixtures) from fake demo presets. Do not edit by hand.",
            "as_of": AS_OF.isoformat(), "config_hash": cfg.hash, "presets": out}


# ops risk console (mock mode) ----------------------------------------------------------------------------------------

OPS_OUT = OUT.with_name("ops-fixtures.json")
SNAPSHOT_POINTS = 8  # snapshots per fake student, so the console's history has real diffs


def _alerts(events: list[EventRecord], cfg: EngineConfig) -> list[dict[str, Any]]:
    """The alerts the consumer would raise for these events, in the ops API's shape, all still open."""
    f = cfg.policy.fraud
    groups: dict[tuple, list] = {}
    for x in rules.per_student(events, f):
        groups.setdefault(x.subject, []).append(x)
    out = []
    for (rule, user, vendor), found in groups.items():
        found.sort(key=lambda x: (x.at, x.key))
        pol = f.rule(rule.value)
        out.append({
            "id": str(uuid5(NAMESPACE_URL, f"kredo-fixture-alert:{user}:{rule}:{vendor}")), "rule": rule.value,
            "severity": pol.severity, "status": "open", "user_id": str(user) if user else None,
            "vendor_id": str(vendor) if vendor else None, "hold": bool(getattr(pol, "hold", False)), "flag": None,
            "instances": len(found), "evidence": {"instances": [x.as_instance() for x in found]},
            "observed_at": found[0].at.isoformat(), "last_seen_at": found[-1].at.isoformat(),
            "created_at": found[0].at.isoformat(), "resolved_by": None, "resolution_reason": None,
            "resolved_at": None, "lift_requested_by": None, "lift_reason": None, "lift_requested_at": None,
            "lifted_by": None, "lifted_at": None, "synthetic": True,
        })
    return out


def _model_health_inputs(histories: dict[Any, list[EventRecord]], cfg: EngineConfig):
    """KRS at each month's end and the labelled outcomes, by replaying the fake students' events (the live service
    reads both from its tables; the numbers come from the same functions)."""
    bounds = monitoring_service.month_starts(AS_OF.astimezone(UTC))
    by_month = {}
    for prev, end in zip(bounds, bounds[1:], strict=False):
        at = end - timedelta(microseconds=1)
        by_month[f"{prev.year}-{prev.month:02d}"] = [score(ev, at, cfg).krs for ev in histories.values()
                                                       if ev[0].occurred_at <= at]
    outcomes = []
    for user, events in histories.items():
        for loan in History.build(events).loans:
            row = outcome_row(events, loan.loan_id, cfg, AS_OF, True)
            if row is not None:
                outcomes.append({"band": row["band"], "pd": row["pd"], "bad": row["bad_flag"], "krs": row["krs"],
                                 "user_id": str(user)})
    return by_month, outcomes


def build_ops(cfg: EngineConfig) -> dict[str, Any]:
    base = cfg.scorecard.calibration.base_score
    rows, details, latest_all, loans, alerts, last_event = [], {}, [], [], [], None
    histories: dict[Any, list[EventRecord]] = {}
    for name in presets.PRESETS:
        user = presets.fixture_user(name)
        events = _with_holds(_records(presets.build(name, user, AS_OF)), cfg)
        times = sorted({e.occurred_at for e in events})[-(SNAPSHOT_POINTS - 1):] + [AS_OF]
        snaps = [risk.snapshot_from_result(score(events, t, cfg), base,
                                           str(uuid5(NAMESPACE_URL, f"kredo-fixture-snap:{name}:{t.isoformat()}")))
                 for t in times]
        r = score(events, AS_OF, cfg)
        latest = snaps[-1]
        user_alerts = [a for a in _alerts(events, cfg) if a["user_id"] == str(user)]
        alerts += user_alerts
        ladder = {"level": r.ladder.level, "clean_cycles_at_level": r.ladder.cycles_at_level,
                  "frozen": r.ladder.frozen, "as_of": AS_OF.isoformat(),
                  "last_step_up_at": r.ladder.last_step_up_at.isoformat() if r.ladder.last_step_up_at else None}
        items = [risk.event_item(e.event_id, e.type.value, e.occurred_at,
                                 "ops" if e.type == EventType.FRAUD_FLAG_SET else "demo_controls", True,
                                 dict(e.payload)) for e in events]
        details[str(user)] = risk.detail(str(user), latest, snaps, items, ladder, user_alerts, [], True)
        rows.append(risk.row(latest, user_id=str(user), synthetic=True,
                             open_alerts=sum(a["status"] == "open" for a in user_alerts)))
        latest_all.append(latest)
        histories[user] = events
        h = History.build(events)
        loans += [{"due_date": x.due_date, "cleared_at": x.finished_at(AS_OF), "closure_type": x.closure_type}
                  for x in h.loans]
        last_event = max(filter(None, [last_event, max(e.occurred_at for e in events)]))
    rows.sort(key=lambda x: (x["krs"], x["user_id"]))
    monitoring = {**risk.summarise(latest_all, loans, [], alerts, now=AS_OF, last_event_at=last_event,
                                   synthetic_users=len(rows)),
                  **monitoring_service.model_health(*_model_health_inputs(histories, cfg), cfg)}
    config = {"active": {"hash": cfg.hash, "scorecard_version": cfg.scorecard.version,
                         "policy_version": cfg.policy.version,
                         "scorecard": cfg.scorecard.model_dump(mode="json", by_alias=True),
                         "policy": cfg.policy.model_dump(mode="json", by_alias=True),
                         "scorecard_yaml": DEFAULT_SCORECARD.read_text(), "policy_yaml": DEFAULT_POLICY.read_text()},
              "history": [{"hash": cfg.hash, "scorecard_version": cfg.scorecard.version,
                           "policy_version": cfg.policy.version, "first_seen_at": AS_OF.isoformat()}]}
    return {"_note": "Generated by services/score (make fixtures) from fake demo presets. Do not edit by hand.",
            "as_of": AS_OF.isoformat(), "users": {"total": len(rows), "rows": rows}, "details": details,
            "monitoring": monitoring, "alerts": alerts, "overrides": [], "config": config}


def _write(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=1, sort_keys=True, default=str) + "\n")
    print(f"wrote {path}")


def main() -> None:
    cfg = load_config()
    _write(Path(sys.argv[1]) if len(sys.argv) > 1 else OUT, build(cfg))
    _write(Path(sys.argv[2]) if len(sys.argv) > 2 else OPS_OUT, build_ops(cfg))


if __name__ == "__main__":
    main()
