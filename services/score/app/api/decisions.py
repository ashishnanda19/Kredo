"""Lending-partner endpoints. Precheck answers "can this student borrow, and how much?" with a fresh score; outcome
records what the partner actually decided. Both are logged in the append-only `decisions` table.
"""

from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.deps import Caller, get_session, require_hmac
from app.db.models import Decision
from app.db.repositories import EventRepository
from app.domain.enums import Source
from app.scoring import snapshots
from app.scoring.knockouts import KNOCKOUTS
from app.util.ids import uuid7

router = APIRouter(prefix="/v1/decisions", tags=["decisions"])

PARTNER_SOURCES = {Source.NBFC, Source.DEMO_CONTROLS}  # demo controls stand in for the partner until one exists


class PrecheckIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: UUID
    requested_amount_paise: Annotated[int, Field(gt=0, strict=True)] | None = None


class OutcomeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: UUID
    decision: Literal["approved", "declined"]
    approved_limit_paise: Annotated[int, Field(ge=0, strict=True)] | None = None
    precheck_id: UUID | None = None
    reason_codes: list[Annotated[str, Field(max_length=64, pattern=r"^[A-Z0-9_]+$")]] = Field(default_factory=list,
                                                                                           max_length=20)


def _partner(caller: Caller) -> Caller:
    if not caller.sources & PARTNER_SOURCES:
        raise HTTPException(403, detail={"code": "PARTNER_ONLY"})
    return caller


@router.post("/precheck")
def precheck(
    body: PrecheckIn,
    request: Request,
    caller: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Scores the student now, logs the answer, and returns eligibility, band, recommended limit and max ticket."""
    _partner(caller)
    cfg, now = request.app.state.config, datetime.now(UTC)
    EventRepository(session).lock_user(body.user_id)
    result = snapshots.compute_for_user(session, body.user_id, now, cfg)
    if result is None:
        raise HTTPException(404, detail={"code": "UNKNOWN_USER"})
    snap = snapshots.save(session, result, cfg, trigger_event_id=None)
    reco = result.limit_reco
    requested_ok = None if body.requested_amount_paise is None else (
        reco["eligible"] and body.requested_amount_paise <= reco["max_ticket_paise"])
    decision = Decision(
        id=uuid7(), kind="precheck", user_id=body.user_id, snapshot_id=snap.id, caller=caller.key_id,
        eligible=reco["eligible"], band=result.band, recommended_limit=reco["amount_paise"],
        max_ticket=reco["max_ticket_paise"], requested_amount=body.requested_amount_paise,
        knockouts=result.knockouts, reason_codes=result.reason_codes,
    )
    session.add(decision)
    session.commit()
    snapshots.cache_latest(request.app.state.redis, snap)
    return {
        "precheck_id": str(decision.id),
        "snapshot_id": str(snap.id),
        "eligible": reco["eligible"],
        "requested_ok": requested_ok,
        "manual_review": reco["manual_review"],
        "band": result.band,
        "level": reco["level"],
        "recommended_limit_paise": reco["amount_paise"],
        "max_ticket_paise": reco["max_ticket_paise"],
        "knockouts": [{"code": k, "message": KNOCKOUTS[k][0], "way_out": KNOCKOUTS[k][1]} for k in result.knockouts],
        "reason_codes": result.reason_codes,
        "versions": {"scorecard": result.scorecard_version, "policy": result.policy_version,
                     "config_hash": result.config_hash},
        "note": "Recommendation only. The lending partner decides.",
    }


def agreement(precheck: Decision | None, decision: str, limit: int | None) -> str:
    """How the partner's decision compares with our recommendation (also recomputed for monitoring)."""
    if precheck is None:
        return "no_precheck"
    if decision == "declined":
        return "match" if not precheck.eligible else "partner_declined_eligible"
    if not precheck.eligible:
        return "partner_approved_ineligible"
    if limit is None or limit == precheck.recommended_limit:
        return "match"
    return "partner_lower" if limit < precheck.recommended_limit else "partner_higher"


@router.post("/{loan_id}/outcome")
def outcome(
    loan_id: UUID,
    body: OutcomeIn,
    caller: Annotated[Caller, Depends(require_hmac)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Records the partner's actual decision. It always wins; we only store it next to our recommendation."""
    _partner(caller)
    pre = session.get(Decision, body.precheck_id) if body.precheck_id else None
    if body.precheck_id and (pre is None or pre.kind != "precheck" or pre.user_id != body.user_id):
        raise HTTPException(422, detail={"code": "UNKNOWN_PRECHECK"})
    row = Decision(
        id=uuid7(), kind="outcome", user_id=body.user_id, loan_id=loan_id, precheck_id=body.precheck_id,
        snapshot_id=pre.snapshot_id if pre else None, caller=caller.key_id,
        recommended_limit=pre.recommended_limit if pre else None, partner_decision=body.decision,
        partner_limit=body.approved_limit_paise, reason_codes=[{"code": c} for c in body.reason_codes],
    )
    session.add(row)
    session.commit()
    return {
        "decision_id": str(row.id),
        "recommended_limit_paise": row.recommended_limit,
        "partner_limit_paise": row.partner_limit,
        "agreement": agreement(pre, body.decision, body.approved_limit_paise),
    }
