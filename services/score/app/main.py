from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis import Redis

from app.api import decisions, events, fraud, health, ops, risk, scores, simulate
from app.config.loader import load_config
from app.db.session import make_engine, make_sessionmaker
from app.logs import configure_logging
from app.scoring import snapshots
from app.settings import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    config = load_config(settings.scorecard_path, settings.policy_path)  # invalid YAML fails at boot

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        engine = make_engine(settings.database_url)
        app.state.settings = settings
        app.state.config = config
        app.state.sessionmaker = make_sessionmaker(engine)
        with app.state.sessionmaker.begin() as s:
            snapshots.register_config(s, config)
        app.state.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        yield
        app.state.redis.close()
        engine.dispose()

    app = FastAPI(
        title="Kredo Score Service",
        version="0.1.0",
        description="Risk engine (KRS) and Aura. Internal service: students never call it directly.",
        openapi_url="/v1/openapi.json",
        docs_url="/v1/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(events.router)
    app.include_router(scores.router)
    app.include_router(decisions.router)
    app.include_router(ops.router)
    app.include_router(fraud.router)
    app.include_router(simulate.router)
    app.include_router(risk.router)
    return app


def _app() -> FastAPI:
    configure_logging()
    return create_app()


app = _app()
