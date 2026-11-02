from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

router = APIRouter(prefix="/v1", tags=["infra"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
def ready(request: Request) -> JSONResponse:
    """Database and Redis reachable; scorecard and policy loaded and valid (they are validated at boot)."""
    checks: dict[str, bool] = {"config": getattr(request.app.state, "config", None) is not None}
    try:
        with request.app.state.sessionmaker() as s:
            s.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False
    try:
        checks["redis"] = bool(request.app.state.redis.ping())
    except Exception:
        checks["redis"] = False
    ok = all(checks.values())
    return JSONResponse({"status": "ready" if ok else "not_ready", "checks": checks}, status_code=200 if ok else 503)
