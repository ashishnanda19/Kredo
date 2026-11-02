"""Runs the outbox relay and the scorer consumer: `python -m app.events.worker [--role all|relay|consumer]`."""

import argparse
import logging
import os
import signal
import socket
import threading
import time

from redis import Redis

from app.config.loader import load_config
from app.db.session import make_engine, make_sessionmaker
from app.events.consumer import consume_once, ensure_group, reclaim_stale
from app.events.relay import publish_pending
from app.logs import configure_logging
from app.scoring import snapshots
from app.settings import get_settings

log = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", choices=["all", "relay", "consumer"], default="all")
    parser.add_argument("--name", default=f"{socket.gethostname()}-{os.getpid()}")
    args = parser.parse_args()

    configure_logging()
    settings = get_settings()
    cfg = load_config(settings.scorecard_path, settings.policy_path)  # invalid YAML stops the worker here
    sm = make_sessionmaker(make_engine(settings.database_url))
    with sm.begin() as s:
        snapshots.register_config(s, cfg)
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    ensure_group(redis, settings)
    stop = threading.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())

    def relay_loop() -> None:
        while not stop.is_set():
            try:
                with sm() as session:
                    sent = publish_pending(session, redis, settings)
            except Exception:
                log.exception("relay_failed")
                sent = 0
            if not sent:
                stop.wait(0.2)

    def consumer_loop() -> None:
        last_reclaim = 0.0
        while not stop.is_set():
            try:
                consume_once(redis, sm, settings, cfg, args.name)
                if time.monotonic() - last_reclaim > 30:
                    reclaim_stale(redis, sm, settings, cfg, args.name)
                    last_reclaim = time.monotonic()
            except Exception:
                log.exception("consumer_failed")
                stop.wait(1)

    loops = {"relay": [relay_loop], "consumer": [consumer_loop], "all": [relay_loop, consumer_loop]}[args.role]
    threads = [threading.Thread(target=fn, name=fn.__name__) for fn in loops]
    for t in threads:
        t.start()
    log.info("worker_started", extra={"role": args.role})
    for t in threads:
        t.join()


if __name__ == "__main__":
    main()
