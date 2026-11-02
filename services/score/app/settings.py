from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.config.loader import DEFAULT_POLICY, DEFAULT_SCORECARD
from app.domain.enums import Source


class HmacKey(BaseModel):
    secret: str = Field(min_length=32)
    # which event sources this key may send: the demo key can never pose as the lending partner
    sources: list[Source]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SCORE_", env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://kredo:kredo@localhost:55433/kredo_score"
    redis_url: str = "redis://localhost:56380/0"
    # JSON in the env, e.g. {"nbfc": {"secret": "...", "sources": ["nbfc"]}}
    hmac_keys: dict[str, HmacKey] = {}
    hmac_max_skew_seconds: int = 300

    stream: str = "kredo:score-events"
    stream_group: str = "scorer"
    stream_dlq: str = "kredo:score-events:dlq"
    stream_maxlen: int = 1_000_000
    max_deliveries: int = 5
    max_batch: int = 500

    feature_mandates: bool = Field(False, validation_alias=AliasChoices("FEATURE_MANDATES", "SCORE_FEATURE_MANDATES"))

    scorecard_path: Path = DEFAULT_SCORECARD
    policy_path: Path = DEFAULT_POLICY

    # ops actors arrive as a short-lived HS256 JWT minted by the Next.js BFF (role + actor id), on top of the HMAC
    ops_jwt_secret: str = Field("", repr=False)
    ops_jwt_issuer: str = "kredo-bff"
    ops_jwt_audience: str = "kredo-score"
    override_max_days: int = 90

    # POST /v1/demo/presets/{name} creates fake students for the demo controls. Never on next to real data.
    demo_presets: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
