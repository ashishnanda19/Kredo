"""The Aura timeline and the what-if simulator. Both are views of `score()`; neither saves anything.

The timeline is the daily Aura series (from the same capped daily KRS the score uses, so the line never disagrees
with the number) plus markers for the events that moved it: repayments (early, on time, late) and ladder level
changes. Markers carry codes; the BFF turns them into plain text.
"""

from datetime import date, datetime, timedelta
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from app.config.loader import EngineConfig
from app.domain.dpd import ist_date
from app.domain.enums import EventType, LoanState
from app.domain.records import EventRecord
from app.features.history import History
from app.scoring.aura import aura_from_krs
from app.scoring.engine import ScoreResult, score

TIMING_MARKER = {LoanState.PAID_EARLY: "repaid_early", LoanState.PAID_ON_TIME: "repaid_on_time",
                 LoanState.PAID_LATE: "repaid_late"}

# what a student can do in a what-if; everything else stays as it happened
SIMULATABLE = frozenset({EventType.REPAYMENT_RECEIVED, EventType.LOAN_CLOSED})


def history(events: list[EventRecord], result: ScoreResult, start: date, end: date, cfg: EngineConfig) -> dict:
    h = History.build([e for e in events if e.occurred_at <= result.evaluated_at])
    days = [{"date": d.day.isoformat(), "aura": aura_from_krs(d.krs)} for d in result.daily if start <= d.day <= end]
    today = ist_date(result.evaluated_at)
    if start <= today <= end:
        days.append({"date": today.isoformat(), "aura": result.aura})

    r = cfg.policy.repayment
    markers: list[dict[str, Any]] = []
    for loan in h.loans:
        timing = loan.timing(r.grace_days, r.early_days)
        if timing in TIMING_MARKER and start <= ist_date(loan.paid_in_full_at) <= end:
            markers.append({"date": ist_date(loan.paid_in_full_at).isoformat(), "kind": TIMING_MARKER[timing],
                            "loan_id": str(loan.loan_id), "amount_paise": loan.owed})
    levels = cfg.policy.ladder.levels
    for at, before, after in result.ladder_changes:
        if start <= ist_date(at) <= end:
            markers.append({"date": ist_date(at).isoformat(), "kind": "level_up" if after > before else "level_down",
                            "level": f"L{after}", "amount_paise": levels[after - 1].limit_paise})
    markers.sort(key=lambda m: (m["date"], m["kind"]))
    return {"user_id": str(result.user_id), "as_of": result.as_of.isoformat(), "from": start.isoformat(),
            "to": end.isoformat(), "frozen": result.evaluated_at != result.as_of, "days": days,
            "markers": markers}


def hypothetical(user_events: list[EventRecord], spec: list[dict]) -> list[EventRecord]:
    """Turn what-if entries ({type, occurred_at, payload}) into event records for this user. Ids are derived from
    the content, so the same what-if always gives the same answer."""
    user = user_events[0].user_id
    out = []
    for i, x in enumerate(spec):
        eid = uuid5(NAMESPACE_URL, f"kredo-what-if:{user}:{i}:{x['type']}:{x['occurred_at'].isoformat()}")
        out.append(EventRecord(eid, EventType(x["type"]), user, x["occurred_at"], x["payload"], synthetic=True))
    return out


def simulate(events: list[EventRecord], extra: list[EventRecord], as_of: datetime, cfg: EngineConfig,
             horizon: datetime | None = None) -> dict:
    """Aura now, and the projected Aura at `horizon` if the hypothetical events happen. Every option a student
    compares is projected to the same horizon, so they differ only by what the student does, not by when the score
    is read (time alone moves scores: decay, the velocity cap)."""
    at = max([horizon or as_of, *(e.occurred_at + timedelta(minutes=1) for e in extra)])
    current = score(events, as_of, cfg)
    projected = score([*events, *extra], at, cfg)

    def view(r: ScoreResult) -> dict:
        return {"krs": r.krs, "band": r.band, "aura": r.aura, "tier": r.tier, "fresh_spawn": r.fresh_spawn,
                "streak": r.streak, "reason_codes": r.reason_codes, "knockouts": r.knockouts,
                "limit_reco": {k: r.limit_reco[k] for k in ("level", "amount_paise", "eligible", "next")}}

    return {"user_id": str(current.user_id), "at": at.isoformat(), "current": view(current),
            "projected": view(projected), "aura_change": projected.aura - current.aura}
