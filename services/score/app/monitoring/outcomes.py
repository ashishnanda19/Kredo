"""The labelling job: `python -m app.monitoring.outcomes`. Run it nightly after the re-score.

For every loan whose label window has closed and that has no outcome yet, it writes one `outcomes` row: the label, and
the score and features the loan had when it was DECIDED. Those are rebuilt by replaying only the events that happened
before the decision, so nothing the student did afterwards can leak into the training data. Outcomes are append-only.
"""

import logging
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import Text, cast, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config.loader import EngineConfig, load_config
from app.db.models import Event, Loan, Outcome, User
from app.db.repositories import to_record
from app.db.session import make_engine, make_sessionmaker
from app.domain.dpd import ist_date
from app.domain.enums import Decision, EventType
from app.domain.records import EventRecord
from app.features.history import History
from app.logs import configure_logging
from app.monitoring.labels import is_labellable, label_loan
from app.scoring.engine import score
from app.settings import get_settings

log = logging.getLogger(__name__)


def decision_time(events: list[EventRecord], loan_id: UUID, disbursed_at: datetime) -> datetime:
    """When the partner decided this loan: its `loan_decided` (approved) event, else the disbursal."""
    for e in events:
        if (e.type == EventType.LOAN_DECIDED and e.payload.get("loan_id") == str(loan_id)
                and e.payload.get("decision") == Decision.APPROVED):
            return min(e.occurred_at, disbursed_at)
    return disbursed_at


def outcome_row(events: list[EventRecord], loan_id: UUID, cfg: EngineConfig, now: datetime,
                synthetic: bool) -> dict | None:
    """The outcome for one loan from its user's whole event log, or None if it is not labellable yet or there was
    nothing known before the decision to build features from."""
    pol = cfg.policy.monitoring.label
    loan = next((x for x in History.build(events).loans if x.loan_id == loan_id), None)
    if loan is None or not is_labellable(loan, now, pol):
        return None
    decided = decision_time(events, loan_id, loan.disbursed_at)
    before = [e for e in events if e.occurred_at < decided]
    if not before:
        return None
    known = score(before, decided - timedelta(microseconds=1), cfg)  # only what was known before the decision
    label = label_loan(loan, pol)
    return {
        "loan_id": loan_id, "label_version": pol.version, "observed_at": label.observed_at, "bad_flag": label.bad,
        "user_id": events[0].user_id, "decision_at": decided, "due_date": loan.due_date, "principal": loan.principal,
        "worst_dpd": label.worst_dpd, "closure_type": label.closure_type, "reason": label.reason, "krs": known.krs,
        "pd": known.pd, "band": known.band, "aura": known.aura, "level": known.limit_reco["level"],
        "features": known.features, "config_hash": cfg.hash, "synthetic": synthetic,
    }


def label_due_loans(session: Session, cfg: EngineConfig, now: datetime) -> int:
    """Writes outcomes for every newly labellable loan. Returns how many."""
    pol = cfg.policy.monitoring.label
    cutoff: date = ist_date(now) - timedelta(days=pol.window_days)
    done = select(Outcome.loan_id).where(Outcome.label_version == pol.version)
    # loans past their window and not yet labelled
    due = (Loan.due_date <= cutoff, Loan.opened_at.is_not(None), Loan.id.not_in(done))
    users = list(session.scalars(select(Loan.user_id).where(*due).distinct().order_by(Loan.user_id)))
    written = 0
    for user_id in users:
        rows = session.scalars(select(Event).where(Event.user_id == user_id, Event.occurred_at <= now)
                               .order_by(Event.occurred_at, cast(Event.event_id, Text)))
        events = [to_record(r) for r in rows]
        synthetic = bool(session.get(User, user_id).synthetic)
        for loan_id in list(session.scalars(select(Loan.id).where(Loan.user_id == user_id, *due))):
            row = outcome_row(events, loan_id, cfg, now, synthetic)
            if row is not None:
                session.execute(insert(Outcome).values(**row).on_conflict_do_nothing())
                written += 1
    return written


def main() -> None:
    configure_logging()
    settings = get_settings()
    cfg = load_config(settings.scorecard_path, settings.policy_path)
    sm = make_sessionmaker(make_engine(settings.database_url))
    with sm.begin() as s:
        n = label_due_loans(s, cfg, datetime.now(UTC))
    log.info("outcomes_labelled", extra={"count": n})


if __name__ == "__main__":
    main()
