"""Ops actors: who is calling, and what their role may do.

Roles match the web app's ops roles (lib/ops-permissions.ts) plus the two risk roles this service adds. Every ops call
is HMAC-signed by the BFF (the service) and carries a short-lived JWT naming the person (the actor).
"""

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request

from app.api.deps import Caller, require_hmac

OPS_ROLES = ("reviewer", "fraud", "support", "admin", "risk_analyst", "risk_admin")

CAN: dict[str, frozenset[str]] = {
    "overrides.view": frozenset({"risk_analyst", "risk_admin", "admin"}),
    "overrides.create": frozenset({"risk_analyst", "risk_admin"}),  # maker
    "overrides.decide": frozenset({"risk_admin"}),  # checker: approve, reject, revoke
    "config.view": frozenset({"risk_analyst", "risk_admin", "admin"}),
    "config.dry_run": frozenset({"risk_analyst", "risk_admin"}),
    "risk.view": frozenset({"risk_analyst", "risk_admin", "admin", "fraud"}),  # per-user KRS, points, events
    "monitoring.view": frozenset(OPS_ROLES),  # aggregates only
    "alerts.view": frozenset(OPS_ROLES),  # support sees rollover alerts so it can offer help
    "alerts.decide": frozenset({"fraud", "risk_admin"}),  # confirm or dismiss, always with a written reason
    "alerts.lift_request": frozenset({"fraud", "risk_analyst", "risk_admin"}),  # maker
    "alerts.lift_decide": frozenset({"risk_admin"}),  # checker; never the person who asked for the lift
}


@dataclass(frozen=True)
class Actor:
    id: UUID
    role: str


def _actor(request: Request) -> Actor:
    settings = request.app.state.settings
    unauthorized = HTTPException(401, detail={"code": "BAD_OPS_TOKEN"})
    header = request.headers.get("authorization", "")
    if not settings.ops_jwt_secret or not header.lower().startswith("bearer "):
        raise unauthorized
    try:
        claims = jwt.decode(header[7:], settings.ops_jwt_secret, algorithms=["HS256"],
                            audience=settings.ops_jwt_audience, issuer=settings.ops_jwt_issuer,
                            options={"require": ["exp", "iat", "sub", "role"]})
        actor = Actor(UUID(claims["sub"]), claims["role"])
    except (jwt.PyJWTError, ValueError):
        raise unauthorized from None
    if actor.role not in OPS_ROLES:
        raise unauthorized
    return actor


def ensure(actor: Actor, capability: str) -> None:
    if actor.role not in CAN[capability]:
        raise HTTPException(403, detail={"code": "ROLE_NOT_ALLOWED", "capability": capability})


def require_ops(capability: str):
    """Dependency: a signed BFF call carrying an ops token whose role holds `capability`."""

    def dep(request: Request, _: Annotated[Caller, Depends(require_hmac)]) -> Actor:
        actor = _actor(request)
        ensure(actor, capability)
        return actor

    return dep
