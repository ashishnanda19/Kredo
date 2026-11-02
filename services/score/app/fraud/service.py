"""Runs the fraud rules for one event, inside the consumer's transaction, before the user is rescored.

Findings are grouped by subject (rule, student, vendor). An instance key already held by any alert for that subject is
never raised again, so a dismissed pattern stays dismissed. New instances join the subject's open alert if there is
one, otherwise they open a new alert. A new holding alert (velocity) writes the hold flag into the event log at once,
so the score computed next in the same transaction already shows `held_for_review`.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import Text, cast, func, select
from sqlalchemy.orm import Session

from app.config.loader import EngineConfig
from app.db.models import Event, FraudAlert, IdentityLink, Spend
from app.db.repositories import EventRepository, to_record
from app.domain.dpd import IST
from app.domain.enums import AlertRule, AlertStatus, EventType
from app.domain.records import EventRecord
from app.events import internal
from app.fraud import rules
from app.fraud.rules import Finding
from app.util.ids import uuid7


def detect(session: Session, ev: EventRecord, as_of: datetime, cfg: EngineConfig) -> list[FraudAlert]:
    """Returns the alerts opened by this event (merges into already-open alerts are not returned)."""
    f = cfg.policy.fraud
    rows = session.scalars(select(Event).where(Event.user_id == ev.user_id, Event.occurred_at <= as_of)
                           .order_by(Event.occurred_at, cast(Event.event_id, Text)))
    events = [to_record(r) for r in rows]
    findings = rules.per_student(events, f) if events else []
    if ev.type == EventType.IDENTIFIER_SEEN and ev.payload["kind"] in f.ring.kinds:
        findings += _rings(session, ev.payload["kind"], ev.payload["digest"])
    if ev.type == EventType.SPEND_MADE:
        findings += _surge(session, UUID(ev.payload["vendor_id"]), ev.occurred_at, cfg)

    by_subject: dict[tuple, list[Finding]] = defaultdict(list)
    for x in findings:
        by_subject[x.subject].append(x)
    opened = []
    for (rule, user_id, vendor_id), group in sorted(by_subject.items(), key=lambda kv: str(kv[0])):
        alert = _raise(session, rule, user_id, vendor_id, group, cfg, synthetic=ev.synthetic)
        if alert is not None:
            opened.append(alert)
    return opened


def _rings(session: Session, kind: str, digest: str) -> list[Finding]:
    links = session.execute(select(IdentityLink.user_id, IdentityLink.first_seen_at)
                            .where(IdentityLink.kind == kind, IdentityLink.digest == digest))
    return rules.ring(kind, digest, [tuple(r) for r in links])


def _surge(session: Session, vendor_id: UUID, at: datetime, cfg: EngineConfig) -> list[Finding]:
    week = rules.week_start(at)
    start = datetime.combine(week, datetime.min.time(), IST)

    def volume(a: datetime, b: datetime) -> int:  # SUM(bigint) comes back as numeric
        return int(session.scalar(select(func.coalesce(func.sum(Spend.amount), 0))
                                  .where(Spend.vendor_id == vendor_id, Spend.at >= a, Spend.at < b)))

    this_week = volume(start, start + timedelta(days=7))
    last_week = volume(start - timedelta(days=7), start)
    found = rules.vendor_surge(vendor_id, week, this_week, last_week, at, cfg.policy.fraud)
    return [found] if found else []


def _raise(session: Session, rule: AlertRule, user_id: UUID | None, vendor_id: UUID | None, group: list[Finding],
           cfg: EngineConfig, *, synthetic: bool) -> FraudAlert | None:
    EventRepository(session).lock(f"fraud-alert:{rule}:{user_id}:{vendor_id}")
    existing = list(session.scalars(
        select(FraudAlert).where(FraudAlert.rule == rule.value,
                                 FraudAlert.user_id.is_not_distinct_from(user_id),
                                 FraudAlert.vendor_id.is_not_distinct_from(vendor_id))
        .order_by(FraudAlert.created_at).with_for_update()))
    known = {k for a in existing for k in a.instance_keys}
    new = sorted((x for x in group if x.key not in known), key=lambda x: (x.at, x.key))
    if not new:
        return None

    open_alert = next((a for a in existing if a.status == AlertStatus.OPEN), None)
    if open_alert is not None:
        open_alert.instance_keys = [*open_alert.instance_keys, *(x.key for x in new)]
        open_alert.evidence = {"instances": [*open_alert.evidence["instances"], *(x.as_instance() for x in new)]}
        open_alert.last_seen_at = max(open_alert.last_seen_at, new[-1].at)
        return None

    policy = cfg.policy.fraud.rule(rule.value)
    alert = FraudAlert(
        id=uuid7(), user_id=user_id, vendor_id=vendor_id, rule=rule.value, severity=policy.severity,
        evidence={"instances": [x.as_instance() for x in new]}, instance_keys=[x.key for x in new],
        status=AlertStatus.OPEN.value, hold=bool(getattr(policy, "hold", False)) and user_id is not None,
        observed_at=new[0].at, last_seen_at=new[-1].at, synthetic=synthetic,
    )
    session.add(alert)
    session.flush()
    if alert.hold:
        set_flag(session, alert, cfg.policy.fraud.hold_flag, alert.observed_at, internal.SYSTEM_ACTOR,
                 f"{rule.value} alert raised; new loans held for ops review.")
    return alert


def set_flag(session: Session, alert: FraudAlert, flag: str, at: datetime, actor_id: UUID, reason: str,
             clear: bool = False) -> None:
    """Set or clear a flag tied to this alert. The reason is service-written text, never the ops note."""
    kind = EventType.FRAUD_FLAG_CLEARED if clear else EventType.FRAUD_FLAG_SET
    internal.write(session, kind, user_id=alert.user_id, key=f"alert:{alert.id}:{flag}:{kind.value}", at=at,
                   payload={"flag_type": flag, "reason": reason, "actor_id": str(actor_id), "ref": str(alert.id)},
                   synthetic=alert.synthetic)
