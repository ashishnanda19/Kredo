"""Integration fixtures. Each test gets a fresh database cloned from a migrated template, and a flushed Redis db.

Without Postgres and Redis (`make up`) integration tests are skipped locally; with CI=true they fail instead.
"""

import os
import time
from uuid import NAMESPACE_URL, uuid4, uuid5

import jwt
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from redis import Redis
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.db.session import make_engine, make_sessionmaker
from app.main import create_app
from app.settings import HmacKey, Settings
from app.util.signing import signed_headers

ADMIN_URL = os.environ.get("SCORE_TEST_DATABASE_URL", "postgresql+psycopg://kredo:kredo@localhost:55433/postgres")
REDIS_URL = os.environ.get("SCORE_TEST_REDIS_URL", "redis://localhost:56380/15")
TEMPLATE = "kredo_score_template"

KEYS = {
    "demo": HmacKey(secret="test-demo-secret-000000000000000000", sources=["demo_controls", "simulator"]),
    "nbfc": HmacKey(secret="test-nbfc-secret-000000000000000000", sources=["nbfc"]),
    "bff": HmacKey(secret="test-bff-secret-0000000000000000000", sources=[]),  # reads and ops only
}
OPS_SECRET = "test-ops-jwt-secret-00000000000000000000"


def ops_token(role: str, actor: str = "maker", *, secret: str = OPS_SECRET, ttl: int = 300) -> str:
    now = int(time.time())
    return jwt.encode({"sub": str(uuid5(NAMESPACE_URL, f"actor:{actor}")), "role": role, "iat": now, "exp": now + ttl,
                       "iss": "kredo-bff", "aud": "kredo-score"}, secret, algorithm="HS256")


def _unavailable(reason: str):
    if os.environ.get("CI"):
        pytest.fail(reason)
    pytest.skip(reason)


@pytest.fixture(scope="session")
def admin_engine():
    engine = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
    except Exception:
        _unavailable("Postgres not reachable; run `make up`")
    with engine.connect() as c:
        c.execute(text(f"DROP DATABASE IF EXISTS {TEMPLATE} WITH (FORCE)"))
        c.execute(text(f"CREATE DATABASE {TEMPLATE}"))
    cfg = Config("alembic.ini")
    cfg.attributes["database_url"] = make_url(ADMIN_URL).set(database=TEMPLATE).render_as_string(hide_password=False)
    cfg.attributes["configure_logger"] = False
    command.upgrade(cfg, "head")
    yield engine
    with engine.connect() as c:
        c.execute(text(f"DROP DATABASE IF EXISTS {TEMPLATE} WITH (FORCE)"))
    engine.dispose()


@pytest.fixture
def db_url(admin_engine):
    name = f"kredo_score_t_{uuid4().hex[:10]}"
    with admin_engine.connect() as c:
        c.execute(text(f"CREATE DATABASE {name} TEMPLATE {TEMPLATE}"))
    yield make_url(ADMIN_URL).set(database=name).render_as_string(hide_password=False)
    with admin_engine.connect() as c:
        c.execute(text(f"DROP DATABASE IF EXISTS {name} WITH (FORCE)"))


@pytest.fixture
def engine(db_url):
    e = make_engine(db_url)
    yield e
    e.dispose()


@pytest.fixture
def sm(engine):
    return make_sessionmaker(engine)


@pytest.fixture
def redis():
    r = Redis.from_url(REDIS_URL, decode_responses=True)
    try:
        r.ping()
    except Exception:
        _unavailable("Redis not reachable; run `make up`")
    r.flushdb()
    yield r
    r.flushdb()
    r.close()


@pytest.fixture
def settings(db_url, redis):
    return Settings(database_url=db_url, redis_url=REDIS_URL, hmac_keys=KEYS, stream="test:score-events",
                    stream_dlq="test:score-events:dlq", max_deliveries=2, ops_jwt_secret=OPS_SECRET,
                    demo_presets=False)  # explicit: a developer's .env must not change what the tests see


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as c:
        yield c


def signed_post(client: TestClient, path: str, body: bytes, key: str = "demo", ts: int | None = None,
                token: str | None = None):
    headers = signed_headers(key, KEYS[key].secret, int(time.time()) if ts is None else ts, "POST", path, body)
    if token:
        headers["authorization"] = f"Bearer {token}"
    return client.post(path, content=body, headers=headers)


def signed_patch(client: TestClient, path: str, body: bytes, key: str = "bff", token: str | None = None):
    headers = signed_headers(key, KEYS[key].secret, int(time.time()), "PATCH", path, body)
    if token:
        headers["authorization"] = f"Bearer {token}"
    return client.patch(path, content=body, headers=headers)


def signed_get(client: TestClient, path: str, key: str = "demo", token: str | None = None):
    headers = signed_headers(key, KEYS[key].secret, int(time.time()), "GET", path, b"")  # path includes ?query
    if token:
        headers["authorization"] = f"Bearer {token}"
    return client.get(path, headers=headers)
