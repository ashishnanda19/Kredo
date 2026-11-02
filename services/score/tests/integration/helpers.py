"""Shared steps for API-level integration tests: signed posts, and draining the outbox and stream synchronously."""

import json
from datetime import UTC, datetime

from app.config.loader import load_config
from app.events.consumer import consume_once, ensure_group
from app.events.relay import publish_pending
from tests.conftest import signed_post

CFG = load_config()


def post(client, path, body, key="demo", token=None):
    return signed_post(client, path, json.dumps(body).encode(), key=key, token=token)


def ingest_and_drain(client, sm, redis, settings, persona, as_of=None):
    """Post a persona's events (or nothing), then publish and consume until the stream is empty, including any
    events the service writes along the way (override and fraud flags)."""
    if persona is not None:
        r = post(client, "/v1/events", {"events": persona.wire})
        assert r.status_code == 202, r.text
    ensure_group(redis, settings)
    clock = (lambda: as_of) if as_of else (lambda: datetime.now(UTC))
    while True:
        with sm() as s:
            published = publish_pending(s, redis, settings)
        consumed = 0
        while n := consume_once(redis, sm, settings, CFG, "t1", block_ms=50, clock=clock):
            consumed += n
        if not published and not consumed:
            return
