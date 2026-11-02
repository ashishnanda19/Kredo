import hashlib
import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

from app.config.schema import PolicyConfig, ScorecardConfig

HERE = Path(__file__).parent
DEFAULT_SCORECARD = HERE / "scorecard_v1.yaml"
DEFAULT_POLICY = HERE / "policy_default.yaml"


@dataclass(frozen=True)
class EngineConfig:
    scorecard: ScorecardConfig
    policy: PolicyConfig
    # hash of the parsed (not raw) config, so comments and formatting don't change it; stored on every snapshot
    hash: str


def config_hash(scorecard: ScorecardConfig, policy: PolicyConfig) -> str:
    body = {"scorecard": scorecard.model_dump(mode="json", by_alias=True),
            "policy": policy.model_dump(mode="json", by_alias=True)}
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def build_config(scorecard: dict, policy: dict) -> EngineConfig:
    sc = ScorecardConfig.model_validate(scorecard)
    pol = PolicyConfig.model_validate(policy)
    return EngineConfig(sc, pol, config_hash(sc, pol))


@lru_cache
def load_config(scorecard_path: Path = DEFAULT_SCORECARD, policy_path: Path = DEFAULT_POLICY) -> EngineConfig:
    return build_config(yaml.safe_load(Path(scorecard_path).read_text()), yaml.safe_load(Path(policy_path).read_text()))
