"""The fraud alert queue. Ops confirm or dismiss an alert, always with a written reason; both land in the audit log.

Confirming an alert whose rule has a `confirm_flag` writes that flag into the event log, which turns it into a
knockout (KO_FRAUD or KO_DUPLICATE). Lifting it is maker-checker: one person asks with a reason, a different risk
admin approves or rejects. Resolving a holding alert either way releases its hold. Ops notes stay in this table and the
audit log; the flags in the event log carry service-written text only.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.ops_auth import Actor, ensure
from app.config.loader import EngineConfig
from app.db.models import FraudAlert
from app.domain.enums import AlertStatus
from app.fraud.service import set_flag
from app.ops import audit

ACTIONS = {  # action → (capability, status it needs)
    "confirm": ("alerts.decide", AlertStatus.OPEN),
    "dismiss": ("alerts.decide", AlertStatus.OPEN),
    "request_lift": ("alerts.lift_request", AlertStatus.CONFIRMED),
    "approve_lift": ("alerts.lift_decide", AlertStatus.LIFT_PENDING),
    "reject_lift": ("alerts.lift_decide", AlertStatus.LIFT_PENDING),
}


class AlertError(Exception):
    def __init__(self, status: int, code: str) -> None:
        super().__init__(code)
        self.status, self.code = status, code


def _iso(t: datetime | None) -> str | None:
    return t.isoformat() if t else None


def as_json(a: FraudAlert) -> dict[str, Any]:
    return {
        "id": str(a.id), "rule": a.rule, "severity": a.severity, "status": a.status,
        "user_id": str(a.user_id) if a.user_id else None, "vendor_id": str(a.vendor_id) if a.vendor_id else None,
        "hold": a.hold, "flag": a.flag, "instances": len(a.instance_keys), "evidence": a.evidence,
        "observed_at": _iso(a.observed_at), "last_seen_at": _iso(a.last_seen_at), "created_at": _iso(a.created_at),
        "resolved_by": str(a.resolved_by) if a.resolved_by else None, "resolution_reason": a.resolution_reason,
        "resolved_at": _iso(a.resolved_at),
        "lift_requested_by": str(a.lift_requested_by) if a.lift_requested_by else None,
        "lift_reason": a.lift_reason, "lift_requested_at": _iso(a.lift_requested_at),
        "lifted_by": str(a.lifted_by) if a.lifted_by else None, "lifted_at": _iso(a.lifted_at),
        "synthetic": a.synthetic,
    }


def act(session: Session, actor: Actor, alert_id: UUID, action: str, reason: str, *, now: datetime,
        cfg: EngineConfig) -> FraudAlert:
    capability, needs = ACTIONS[action]
    ensure(actor, capability)
    a = session.scalars(select(FraudAlert).where(FraudAlert.id == alert_id).with_for_update()).first()
    if a is None:
        raise AlertError(404, "UNKNOWN_ALERT")
    if a.status != needs:
        raise AlertError(409, f"NOT_{needs.value.upper()}")
    before = as_json(a)
    hold_flag = cfg.policy.fraud.hold_flag

    if action in ("confirm", "dismiss"):
        a.status = AlertStatus.CONFIRMED.value if action == "confirm" else AlertStatus.DISMISSED.value
        a.resolved_by, a.resolution_reason, a.resolved_at = actor.id, reason, now
        if action == "confirm" and a.user_id is not None:
            flag = cfg.policy.fraud.rule(a.rule).confirm_flag
            if flag:
                a.flag = flag
                set_flag(session, a, flag, now, actor.id, f"{a.rule} alert confirmed by ops.")
        if a.hold:
            set_flag(session, a, hold_flag, now, actor.id, f"{a.rule} alert {action}ed; hold released.", clear=True)
    elif action == "request_lift":
        if not a.flag:
            raise AlertError(409, "NOTHING_TO_LIFT")
        a.status = AlertStatus.LIFT_PENDING.value
        a.lift_requested_by, a.lift_reason, a.lift_requested_at = actor.id, reason, now
    else:
        if actor.id == a.lift_requested_by:
            raise AlertError(403, "MAKER_CANNOT_DECIDE")
        if action == "approve_lift":
            a.status, a.lifted_by, a.lifted_at = AlertStatus.LIFTED.value, actor.id, now
            set_flag(session, a, a.flag, now, actor.id, f"{a.rule} flag lifted by ops (maker-checker).", clear=True)
        else:
            a.status = AlertStatus.CONFIRMED.value
            a.lift_requested_by = a.lift_reason = a.lift_requested_at = None
    session.flush()
    audit.record(session, actor.id, f"alert.{action}", f"fraud_alert:{a.id}", before,
                 {**as_json(a), "note": reason})
    return a
