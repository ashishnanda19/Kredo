"""Outbox relay: publishes committed events to the Redis stream, oldest first.

Delivery is at least once. If Redis accepts a batch but the commit that marks it published fails, the batch is sent
again; the consumer is idempotent, so that is safe.
"""

from redis import Redis
from sqlalchemy.orm import Session

from app.db.repositories import OutboxRepository
from app.settings import Settings


def publish_pending(session: Session, redis: Redis, settings: Settings, limit: int = 500) -> int:
    repo = OutboxRepository(session)
    rows = repo.claim_unpublished(limit)
    if not rows:
        session.rollback()
        return 0
    pipe = redis.pipeline(transaction=False)
    for _, event_id, user_id, event_type in rows:
        pipe.xadd(
            settings.stream,
            {"event_id": str(event_id), "user_id": str(user_id), "type": event_type},
            maxlen=settings.stream_maxlen,
            approximate=True,
        )
    pipe.execute()
    repo.mark_published([r[0] for r in rows])
    session.commit()
    return len(rows)
