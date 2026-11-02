"""The weekly monitoring report: `python -m app.monitoring.report` (`make report`). Schedule it weekly (see RUNBOOK.md).

Writes `reports/monitoring-YYYY-MM-DD.md` (for people) and `.json` (for tools) from the same numbers the ops console
shows. With `--cohorts file.csv` (columns `user_id,cohort`, for example year of study) it adds the fairness check:
band and eligibility rates across cohorts that are NOT scored. The file is read, never stored, and cohorts under
`min_cell` students are hidden. A person reviews that section; nothing in it changes a score.
"""

import argparse
import csv
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.config.loader import EngineConfig, load_config
from app.db.session import make_engine, make_sessionmaker
from app.logs import configure_logging
from app.monitoring import metrics
from app.monitoring.service import fairness_rows, overview
from app.settings import get_settings

log = logging.getLogger(__name__)


def read_cohorts(path: Path) -> dict[str, str]:
    with path.open(newline="") as f:
        return {row["user_id"]: row["cohort"] for row in csv.DictReader(f)}


def build(session: Session, cfg: EngineConfig, now: datetime, cohorts: dict[str, str] | None = None) -> dict[str, Any]:
    report = {"generated_at": now.isoformat(), "versions": {"scorecard": cfg.scorecard.version,
                                                            "policy": cfg.policy.version, "config_hash": cfg.hash},
              **overview(session, cfg, now)}
    if cohorts:
        f = cfg.policy.monitoring.fairness
        report["fairness"] = metrics.fairness(fairness_rows(session), cohorts, min_cell=f.min_cell,
                                              flag_below=f.flag_below)
    return report


def _pct(x: float | None, d: int = 1) -> str:
    return "n/a" if x is None else f"{x * 100:.{d}f}%"


def render(r: dict[str, Any]) -> str:
    """The report as Markdown. Every table says how many loans or students it is based on."""
    v = r["versions"]
    lines = ["# Kredo score: weekly monitoring report", "",
             f"Generated {r['generated_at'][:16].replace('T', ' ')} UTC. Scorecard {v['scorecard']}, policy "
             f"{v['policy']}, config `{v['config_hash'][:12]}`.", "",
             "Kredo's own in-app score, not a credit bureau score. The lending partner makes every credit "
             "decision.", "",
             "## Population", "",
             f"{r['users']} students scored ({r['synthetic_users']} synthetic), {r['eligible_now']} eligible now. "
             f"Data freshness: {r['freshness_minutes']} minutes since the last event.", "",
             "| Band | " + " | ".join(r["bands"]) + " |", "|---|" + "---|" * len(r["bands"]),
             "| Students | " + " | ".join(str(n) for n in r["bands"].values()) + " |", ""]

    d = r["drift"]
    lines += ["## Drift (KRS, month on month)", "",
              f"PSI alert level {d['alert_above']}. " + ("**ALERT: the latest PSI is above the alert level.**"
                                                           if d["alert"] else "No alert."), "",
              "Under 0.1 stable, up to the alert level some shift, above it an alert.", "",
              "| Month | Students | PSI vs previous month | Reading |", "|---|---|---|---|"]
    few = f"n/a (under {d['min_users']} students)"

    def reading(p: dict[str, Any]) -> str:
        if p["psi"] is None:
            return "too few students"
        return "ALERT" if p["psi"] > d["alert_above"] else "some shift" if p["psi"] > 0.1 else "stable"

    lines += [f"| {p['month']} | {p['users']} | {p['psi'] if p['psi'] is not None else few} | {reading(p)} |"
              for p in d["points"]]

    lab = r["labels"]
    lines += ["", f"## Calibration (label v{lab['version']}: bad = {lab['bad_dpd']}+ DPD within {lab['window_days']} "
              "days of the due date, or settled, restructured or written off)", "",
              "| Band | Labelled loans | Bad | Predicted PD | Observed bad rate | Reliable |",
              "|---|---|---|---|---|---|"]
    lines += [f"| {c['band']} | {c['loans']} | {c['bad']} | {_pct(c['predicted_pd'], 2)} | "
              f"{_pct(c['observed_bad_rate'])} | {'yes' if c['reliable'] else 'too few loans'} |"
              for c in r["calibration"]]
    x = r["discrimination"]
    lines += ["", f"Separation of good and bad loans on {x['loans']} labelled loans ({x['bad']} bad): "
              f"Gini {x['gini'] if x['gini'] is not None else 'n/a'}, KS {x['ks'] if x['ks'] is not None else 'n/a'}, "
              f"AUC {x['auc'] if x['auc'] is not None else 'n/a'}.", ""]

    lines += ["## DPD roll rates", "", f"Based on {r['dpd_roll']['matured_loans']} loans past their due date.", "",
              "| From | To | Loans reaching it | Of | Rate |", "|---|---|---|---|---|"]
    lines += [f"| {s['from']} | {s['to']} | {s['reached']} | {s['base']} | {_pct(s['rate'])} |"
              for s in r["dpd_roll"]["stages"]]

    a = r["approval"]
    lines += ["", "## Approval and agreement with the lending partner", "",
              f"Prechecks: {a['prechecks']} ({_pct(a['precheck_eligible_rate'])} eligible). Partner decisions: "
              f"{a['outcomes']} ({_pct(a['approval_rate'])} approved).", ""]
    lines += [f"- {k.replace('_', ' ')}: {n}" for k, n in sorted(a["agreement"].items())]

    al = r["alerts"]
    lines += ["", "## Fraud alerts", "", f"Open now: {al['open']} ({al['open_by_rule'] or 'none'}).", ""]
    if al["confirm_rate_by_rule"]:
        lines += ["Confirm rate among resolved alerts:", ""]
        lines += [f"- {rule}: {_pct(rate, 0)}" for rule, rate in sorted(al["confirm_rate_by_rule"].items())]
    else:
        lines += ["No alert has been resolved yet, so there is no confirm rate."]

    v2 = r["v2_readiness"]
    lines += ["", "## v2 readiness", "",
              f"{v2['labelled_loans']} of {v2['target_loans']} labelled loans, {v2['bad_loans']} of {v2['target_bad']} "
              "bad loans. Train v2 only after both targets are met; recalibrate v1 quarterly until then.", ""]

    if "fairness" in r:
        fr = r["fairness"]
        lines += ["## Fairness check (for a person to review)", "", fr["note"], "",
                  "| Cohort | Students | Eligible | Band A or B | Mean Aura | Eligible vs best | Flag |",
                  "|---|---|---|---|---|---|---|"]
        lines += [f"| {c['cohort']} | {c['students']} | {_pct(c['eligible_rate'])} | {_pct(c['band_a_or_b_rate'])} | "
                  f"{c['mean_aura']} | {c['ratio_to_best']} | {'REVIEW' if c['flag'] else ''} |"
                  for c in fr["cohorts"]]
        if fr["hidden_small_cohorts"]:
            lines += ["", f"{fr['hidden_small_cohorts']} cohort(s) hidden because they are too small to show safely."]
        lines += [""]
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description="Write the weekly monitoring report.")
    ap.add_argument("--out", default="reports", help="directory for the .md and .json files")
    ap.add_argument("--cohorts", help="CSV with columns user_id,cohort for the fairness check (not stored)")
    args = ap.parse_args()
    configure_logging(logging.WARNING)
    settings = get_settings()
    cfg = load_config(settings.scorecard_path, settings.policy_path)
    now = datetime.now(UTC)
    sm = make_sessionmaker(make_engine(settings.database_url))
    with sm() as s:
        report = build(s, cfg, now, read_cohorts(Path(args.cohorts)) if args.cohorts else None)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    stem = out / f"monitoring-{now.date().isoformat()}"
    stem.with_suffix(".md").write_text(render(report))
    stem.with_suffix(".json").write_text(json.dumps(report, indent=1, default=str) + "\n")
    print(f"wrote {stem}.md and {stem}.json")
    if report["drift"]["alert"]:
        print("ALERT: KRS drift is above the PSI alert level")


if __name__ == "__main__":
    main()
