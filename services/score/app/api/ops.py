"""Ops endpoints: maker-checker overrides and the config view and dry-run. Every change lands in the audit log."""

from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Any, Literal
from uuid import UUID

import yaml
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.api.ops_auth import Actor, require_ops
from app.config.loader import build_config
from app.db.models import ConfigVersion, Override
from app.domain.enums import OverrideField
from app.ops import dry_run as dry
from app.ops import overrides as ov

router = APIRouter(prefix="/v1/ops", tags=["ops"])


class OverrideIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: UUID
    field: OverrideField
    value: Annotated[int, Field(ge=0, strict=True)]
    reason: Annotated[str, Field(min_length=10, max_length=500)]
    expires_at: AwareDatetime


class DecideIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: Annotated[str, Field(min_length=3, max_length=500)] | None = None


class DryRunIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scorecard_yaml: Annotated[str, Field(max_length=100_000)] | None = None
    policy_yaml: Annotated[str, Field(max_length=100_000)] | None = None


def settings_text(path) -> str:
    return Path(path).read_text()


def _raise(e: ov.OverrideError):
    raise HTTPException(e.status, detail={"code": e.code}) from None


@router.get("/overrides")
def list_overrides(
    _: Annotated[Actor, Depends(require_ops("overrides.view"))],
    session: Annotated[Session, Depends(get_session)],
    status: Literal["pending", "approved", "rejected", "revoked"] | None = None,
    user_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[dict[str, Any]]:
    stmt = select(Override).order_by(Override.created_at.desc()).limit(limit)
    if status:
        stmt = stmt.where(Override.status == status)
    if user_id:
        stmt = stmt.where(Override.user_id == user_id)
    return [ov.as_json(o) for o in session.scalars(stmt)]


@router.post("/overrides", status_code=201)
def create_override(
    body: OverrideIn,
    request: Request,
    actor: Annotated[Actor, Depends(require_ops("overrides.create"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """The maker proposes. Nothing changes until a different person with the checker role approves."""
    try:
        o = ov.create(session, actor, user_id=body.user_id, field=body.field, value=body.value, reason=body.reason,
                      expires_at=body.expires_at, now=datetime.now(UTC),
                      max_days=request.app.state.settings.override_max_days, cfg=request.app.state.config)
    except ov.OverrideError as e:
        _raise(e)
    session.commit()
    return ov.as_json(o)


def _decide(action: str):
    def handler(
        override_id: UUID,
        actor: Annotated[Actor, Depends(require_ops("overrides.decide"))],
        session: Annotated[Session, Depends(get_session)],
        body: DecideIn | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        try:
            if action == "revoke":
                o = ov.revoke(session, actor, override_id, now=now)
            else:
                o = ov.decide(session, actor, override_id, approve=action == "approve", now=now)
        except ov.OverrideError as e:
            session.rollback()
            _raise(e)
        session.commit()
        return ov.as_json(o)

    handler.__name__ = f"{action}_override"
    return handler


router.post("/overrides/{override_id}/approve", summary="Approve (checker; never the maker)")(_decide("approve"))
router.post("/overrides/{override_id}/reject", summary="Reject (checker; never the maker)")(_decide("reject"))
router.post("/overrides/{override_id}/revoke", summary="Revoke an approved override")(_decide("revoke"))


@router.get("/config")
def get_config(
    request: Request,
    _: Annotated[Actor, Depends(require_ops("config.view"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    cfg = request.app.state.config
    history = session.scalars(select(ConfigVersion).order_by(ConfigVersion.first_seen_at.desc()).limit(50))
    return {
        "active": {"hash": cfg.hash, "scorecard_version": cfg.scorecard.version, "policy_version": cfg.policy.version,
                   "scorecard": cfg.scorecard.model_dump(mode="json", by_alias=True),
                   "policy": cfg.policy.model_dump(mode="json", by_alias=True),
                   # the files as deployed, for the read-only view and as a starting point for a dry-run
                   "scorecard_yaml": settings_text(request.app.state.settings.scorecard_path),
                   "policy_yaml": settings_text(request.app.state.settings.policy_path)},
        "history": [{"hash": c.hash, "scorecard_version": c.scorecard_version, "policy_version": c.policy_version,
                     "first_seen_at": c.first_seen_at.isoformat()} for c in history],
    }


@router.post("/config/dry-run")
def config_dry_run(
    body: DryRunIn,
    request: Request,
    _: Annotated[Actor, Depends(require_ops("config.dry_run"))],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    """Validate a candidate scorecard and/or policy, then rescore the last 90 days of users with it. Read-only."""
    active = request.app.state.config
    try:
        sc = yaml.safe_load(body.scorecard_yaml) if body.scorecard_yaml else active.scorecard.model_dump(by_alias=True)
        pol = yaml.safe_load(body.policy_yaml) if body.policy_yaml else active.policy.model_dump(by_alias=True)
        candidate = build_config(sc, pol)
    except yaml.YAMLError:
        raise HTTPException(422, detail={"code": "BAD_YAML"}) from None
    except ValidationError as e:
        errors = [{"at": ".".join(str(p) for p in err["loc"]), "error": err["msg"]} for err in e.errors()]
        raise HTTPException(422, detail={"code": "INVALID_CONFIG", "errors": errors}) from None
    return {"active_hash": active.hash, **dry.dry_run(session, candidate, datetime.now(UTC))}
