import time
from collections.abc import Iterator
from dataclasses import dataclass

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.domain.enums import Source
from app.settings import Settings
from app.util import signing


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_session(request: Request) -> Iterator[Session]:
    with request.app.state.sessionmaker() as session:
        yield session


@dataclass(frozen=True)
class Caller:
    key_id: str
    sources: frozenset[Source]


async def require_hmac(request: Request) -> Caller:
    """Verifies X-Kredo-* headers against the raw body. Same 401 for every failure so callers learn nothing."""
    settings: Settings = request.app.state.settings
    unauthorized = HTTPException(401, detail={"code": "BAD_SIGNATURE"})
    key_id = request.headers.get(signing.KEY_HEADER, "")
    given = request.headers.get(signing.SIG_HEADER, "")
    key = settings.hmac_keys.get(key_id)
    try:
        ts = int(request.headers.get(signing.TS_HEADER, ""))
    except ValueError:
        raise unauthorized from None
    if key is None or abs(time.time() - ts) > settings.hmac_max_skew_seconds:
        raise unauthorized
    path = request.url.path + (f"?{request.url.query}" if request.url.query else "")
    if not signing.verify(key.secret, ts, request.method, path, await request.body(), given):
        raise unauthorized
    return Caller(key_id=key_id, sources=frozenset(key.sources))
