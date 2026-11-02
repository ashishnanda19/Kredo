"""Config dry-run: score recent users with a candidate scorecard/policy and count who would move, before anything
goes live. Going live is a reviewed YAML change and a deploy; this flow never changes the active config.
"""

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config.loader import EngineConfig
from app.db.models import Event, ScoreSnapshot
from app.db.repositories import to_record
from app.scoring.engine import score


def mask(user_id: Any) -> str:
    """Identifiers are masked by default in ops views."""
    s = str(user_id)
    return f"{s[:4]}…{s[-4:]}"


def dry_run(session: Session, candidate: EngineConfig, now: datetime, *, days: int = 90, limit: int = 5000,
            sample: int = 20) -> dict[str, Any]:
    since = now - timedelta(days=days)
    latest = (select(ScoreSnapshot.user_id, func.max(ScoreSnapshot.as_of).label("as_of"))
              .where(ScoreSnapshot.as_of >= since).group_by(ScoreSnapshot.user_id).limit(limit).subquery())
    snaps = session.scalars(
        select(ScoreSnapshot).join(latest, (ScoreSnapshot.user_id == latest.c.user_id)
                                   & (ScoreSnapshot.as_of == latest.c.as_of))
        .order_by(ScoreSnapshot.user_id, ScoreSnapshot.id.desc())
    ).all()

    seen, bands, levels, eligibility, rows = set(), Counter(), Counter(), Counter(), []
    for snap in snaps:
        if snap.user_id in seen:
            continue
        seen.add(snap.user_id)
        events = [to_record(e) for e in session.scalars(select(Event).where(Event.event_id.in_(snap.input_event_ids)))]
        new = score(events, snap.as_of, candidate)
        old_level, new_level = (snap.limit_reco or {}).get("level"), new.limit_reco["level"]
        old_elig, new_elig = (snap.limit_reco or {}).get("eligible"), new.limit_reco["eligible"]
        if snap.band != new.band:
            bands[f"{snap.band}→{new.band}"] += 1
        if old_level != new_level:
            levels[f"{old_level}→{new_level}"] += 1
        if old_elig != new_elig:
            eligibility["became_eligible" if new_elig else "lost_eligibility"] += 1
        if (snap.band != new.band or old_level != new_level) and len(rows) < sample:
            rows.append({"user": mask(snap.user_id), "krs": [snap.krs, new.krs], "band": [snap.band, new.band],
                         "level": [old_level, new_level]})
    return {
        "candidate": {"hash": candidate.hash, "scorecard_version": candidate.scorecard.version,
                      "policy_version": candidate.policy.version},
        "window_days": days,
        "users_checked": len(seen),
        "band_changes": dict(sorted(bands.items())),
        "users_changing_band": sum(bands.values()),
        "level_changes": dict(sorted(levels.items())),
        "eligibility_changes": dict(eligibility),
        "sample": rows,
    }
