"""The monitoring overview: `overview()` feeds GET /v1/ops/monitoring and the weekly report, so both always agree.

Model-health numbers (drift, calibration, Gini and KS, v2 readiness) read the `outcomes` table, which holds each
loan's decision-time score and its label once the label window has closed.
"""

from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.dialects.postgresql import distinct_on
from sqlalchemy.orm import Session, aliased

from app.api.decisions import agreement
from app.config.loader import EngineConfig
from app.db.models import Decision, Event, FraudAlert, Loan, Outcome, ScoreSnapshot, User
from app.monitoring import metrics
from app.ops import risk

MONTHS = 6


def month_starts(now: datetime, months: int = MONTHS) -> list[datetime]:
    """The first instant (UTC) of each of the last `months` months, then `now` itself for the month to date."""
    y, m = now.year, now.month
    firsts = []
    for k in range(months, 0, -1):
        yy, mm = y, m - k + 1
        while mm < 1:
            yy, mm = yy - 1, mm + 12
        firsts.append(datetime(yy, mm, 1, tzinfo=UTC))
    return [*firsts, now]


def krs_by_month(session: Session, now: datetime, months: int = MONTHS) -> dict[str, list[int]]:
    """Each user's KRS at the end of each month (their latest snapshot before the next month starts). The last entry is
    the month to date, labelled by the current month."""
    bounds = month_starts(now, months)
    out: dict[str, list[int]] = {}
    for prev, end in zip(bounds, bounds[1:], strict=False):  # the month that starts at `prev` ends at `end`
        sub = (select(ScoreSnapshot.krs).ext(distinct_on(ScoreSnapshot.user_id))
               .where(ScoreSnapshot.as_of < end).order_by(ScoreSnapshot.user_id, ScoreSnapshot.as_of.desc()))
        out[f"{prev.year}-{prev.month:02d}"] = list(session.scalars(sub))
    return out


def outcome_rows(session: Session, cfg: EngineConfig) -> list[dict[str, Any]]:
    version = cfg.policy.monitoring.label.version
    return [{"band": b, "pd": pd, "bad": bad, "krs": krs, "user_id": str(u)} for b, pd, bad, krs, u in session.execute(
        select(Outcome.band, Outcome.pd, Outcome.bad_flag, Outcome.krs, Outcome.user_id)
        .where(Outcome.label_version == version))]


def model_health(by_month: Mapping[str, Sequence[float]], outcomes: Sequence[Mapping[str, Any]],
                 cfg: EngineConfig) -> dict[str, Any]:
    m = cfg.policy.monitoring
    return {
        "labels": {"version": m.label.version, "window_days": m.label.window_days, "bad_dpd": m.label.bad_dpd},
        "drift": metrics.drift_series({k: v for k, v in by_month.items() if v}, bin_width=m.psi.bin_width,
                                      alert_above=m.psi.alert_above, min_users=m.psi.min_users),
        "calibration": metrics.calibration(outcomes, min_loans=m.calibration.min_loans_per_band),
        "discrimination": metrics.discrimination(outcomes),
        "v2_readiness": {"labelled_loans": len(outcomes), "bad_loans": sum(bool(o["bad"]) for o in outcomes),
                         "target_loans": m.v2.target_loans, "target_bad": m.v2.target_bad},
    }


def overview(session: Session, cfg: EngineConfig, now: datetime | None = None) -> dict[str, Any]:
    now = now or datetime.now(UTC)
    sub = (select(ScoreSnapshot).ext(distinct_on(ScoreSnapshot.user_id))
           .order_by(ScoreSnapshot.user_id, ScoreSnapshot.as_of.desc(), ScoreSnapshot.id.desc()).subquery())
    latest = [risk.snapshot_from_row(x) for x in session.scalars(select(aliased(ScoreSnapshot, sub)).limit(100_000))]
    loans = [{"due_date": due, "cleared_at": min([t for t in (paid, closed) if t], default=None), "closure_type": ct}
             for due, paid, closed, ct in session.execute(
                 select(Loan.due_date, Loan.paid_in_full_at, Loan.closed_at, Loan.closure_type))]
    pre = aliased(Decision)
    decisions = [{"kind": "precheck", "eligible": e, "partner_decision": None, "agreement": None}
                 for (e,) in session.execute(select(Decision.eligible).where(Decision.kind == "precheck"))]
    for d, p in session.execute(select(Decision, pre).outerjoin(pre, and_(pre.id == Decision.precheck_id))
                                .where(Decision.kind == "outcome")):
        decisions.append({"kind": "outcome", "eligible": None, "partner_decision": d.partner_decision,
                          "agreement": agreement(p, d.partner_decision, d.partner_limit)})
    alerts = [{"rule": r, "severity": sev, "status": st}
              for r, sev, st in session.execute(select(FraudAlert.rule, FraudAlert.severity, FraudAlert.status))]
    out = risk.summarise(
        latest, loans, decisions, alerts, now=now, last_event_at=session.scalar(select(func.max(Event.received_at))),
        synthetic_users=session.scalar(select(func.count()).select_from(User).where(User.synthetic)) or 0)
    out.update(model_health(krs_by_month(session, now), outcome_rows(session, cfg), cfg))
    return out


def fairness_rows(session: Session) -> list[dict[str, Any]]:
    sub = (select(ScoreSnapshot).ext(distinct_on(ScoreSnapshot.user_id))
           .order_by(ScoreSnapshot.user_id, ScoreSnapshot.as_of.desc(), ScoreSnapshot.id.desc()).subquery())
    return [{"user_id": str(s.user_id), "band": s.band, "aura": s.aura, "eligible": bool((s.limit_reco or {})
                                                                                         .get("eligible"))}
            for s in session.scalars(select(aliased(ScoreSnapshot, sub)))]
