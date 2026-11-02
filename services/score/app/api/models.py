"""Response models for the endpoints the Next.js BFF reads. They exist so the OpenAPI schema is precise enough to
generate the web app's TypeScript types (lib/score/api-types.ts). Internal fields (krs, pd, band, points) are here
on purpose: the service is not student-facing; the BFF strips them.
"""

from typing import Literal

from pydantic import BaseModel, Field


class ReasonCode(BaseModel):
    code: str
    direction: Literal["up", "down", "neutral"]
    points: int


class NextStep(BaseModel):
    level: str
    amount_paise: int
    cycles_needed: int
    blockers: list[str]


class OpenLoan(BaseModel):
    loan_id: str
    due_date: str
    outstanding_paise: int
    dpd: int


class LimitReco(BaseModel):
    level: str | None
    amount_paise: int
    eligible: bool
    action: str
    held_for_review: bool = False
    manual_review: bool
    outstanding_paise: int
    max_ticket_paise: int
    cycles_at_level: int
    frozen: bool
    next: NextStep | None
    next_level_in_cycles: int | None
    open_loans: list[OpenLoan] = []
    overrides: list[dict]


class LadderLevel(BaseModel):
    level: str
    amount_paise: int


class Versions(BaseModel):
    scorecard: str
    policy: str
    config_hash: str


class ScoreOut(BaseModel):
    user_id: str
    snapshot_id: str
    as_of: str
    evaluated_at: str | None = None
    krs: int
    pd: float
    band: str
    aura: int
    tier: str
    fresh_spawn: bool
    streak: int
    reason_codes: list[ReasonCode]
    knockouts: list[str]
    limit_reco: LimitReco | None
    versions: Versions
    ladder_levels: list[LadderLevel] = []


class AuraPoint(BaseModel):
    date: str
    aura: int


class Marker(BaseModel):
    date: str
    kind: Literal["repaid_early", "repaid_on_time", "repaid_late", "level_up", "level_down"]
    loan_id: str | None = None
    level: str | None = None
    amount_paise: int


class HistoryOut(BaseModel):
    user_id: str
    as_of: str
    from_: str = Field(alias="from")  # `from` is a Python keyword
    to: str
    frozen: bool
    days: list[AuraPoint]
    markers: list[Marker]


class SimView(BaseModel):
    krs: int
    band: str
    aura: int
    tier: str
    fresh_spawn: bool
    streak: int
    reason_codes: list[ReasonCode]
    knockouts: list[str]
    limit_reco: dict


class SimulateOut(BaseModel):
    user_id: str
    at: str
    current: SimView
    projected: SimView
    aura_change: int


class PresetOut(BaseModel):
    preset: str
    user_id: str
    events: int
