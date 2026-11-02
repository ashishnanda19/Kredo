"""The fraud alert queue for ops: list, read, act (confirm, dismiss, maker-checker lift), and a per-vendor view."""

from collections import Counter
from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.api.ops_auth import Actor, require_ops
from app.db.models import FraudAlert
from app.domain.enums import AlertRule, AlertStatus, Severity
from app.ops import alerts as al

router = APIRouter(prefix="/v1/ops", tags=["ops"])

SEVERITY_ORDER = case({"high": 0, "medium": 1, "low": 2}, value=FraudAlert.severity, else_=3)


class AlertAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["confirm", "dismiss", "request_lift", "approve_lift", "reject_lift"]
    # stays in fraud_alerts and the audit log only; keep personal data out of it
    reason: Annotated[str, Field(min_length=10, max_length=500)]


@router.get("/fraud-alerts")
def list_alerts(
    _: Annotated[Actor, Depends(require_ops("alerts.view"))],
    session: Annotated[Session, Depends(get_session)],
    status: AlertStatus | None = None,
    rule: AlertRule | None = None,
    severity: Severity | None = None,
    user_id: UUID | None = None,
    vendor_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[dict[str, Any]]:
    """Most severe first, then newest."""
    stmt = select(FraudAlert).order_by(SEVERITY_ORDER, FraudAlert.last_seen_at.desc()).limit(limit)
    for column, value in ((FraudAlert.status, status), (FraudAlert.rule, rule), (FraudAlert.severity, severity),
                          (FraudAlert.user_id, user_id), (FraudAlert.vendor_id, vendor_id)):
        if value is not None:
            stmt = stmt.where(column == value)
    return [al.as_json(a) for a in session.scalars(stmt)]


@router.get("/fraud-alerts/{alert_id}")
def get_alert(
    alert_id: UUID,
    _: Annotated[Actor, Depends(require_ops("alerts.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    a = session.get(FraudAlert, alert_id)
    if a is None:
        raise HTTPException(404, detail={"code": "UNKNOWN_ALERT"})
    return al.as_json(a)


@router.patch("/fraud-alerts/{alert_id}")
def act_on_alert(
    alert_id: UUID,
    body: AlertAction,
    request: Request,
    actor: Annotated[Actor, Depends(require_ops("alerts.view"))],  # the action's own capability is checked inside
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Confirm or dismiss (with a reason), or ask for / approve / reject lifting a confirmed knockout flag."""
    try:
        a = al.act(session, actor, alert_id, body.action, body.reason, now=datetime.now(UTC),
                   cfg=request.app.state.config)
    except al.AlertError as e:
        session.rollback()
        raise HTTPException(e.status, detail={"code": e.code}) from None
    session.commit()
    return al.as_json(a)


@router.get("/vendors/{vendor_id}/fraud-signals")
def vendor_signals(
    vendor_id: UUID,
    _: Annotated[Actor, Depends(require_ops("alerts.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Every alert naming this vendor, across students: collusion pairs, concentration and volume surges."""
    found = list(session.scalars(select(FraudAlert).where(FraudAlert.vendor_id == vendor_id)
                                 .order_by(SEVERITY_ORDER, FraudAlert.last_seen_at.desc()).limit(500)))
    return {
        "vendor_id": str(vendor_id),
        "students": len({a.user_id for a in found if a.user_id}),
        "open": sum(a.status == AlertStatus.OPEN for a in found),
        "by_rule": dict(Counter(a.rule for a in found)),
        "signals": dict(Counter(i.get("signal") for a in found for i in a.evidence.get("instances", []))),
        "alerts": [al.as_json(a) for a in found],
    }
