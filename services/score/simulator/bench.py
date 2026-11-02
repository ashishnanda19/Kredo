"""Checks the performance targets from the spec: `make bench` (`python -m simulator.bench [--users N] [--workers W]`).

It builds its own throwaway database (`kredo_score_bench`) and its own API process on port 8123, so it never touches
the dev database or a running stack. It needs `make up` (Postgres and Redis). Steps, each against a target:

  ingest        bursts of 500 events through the signed API: at least 500 events/s, none lost
  cached read   GET /v1/users/{id}/score served from the Redis cache: p95 under 50 ms
  recompute     one user's full re-score and snapshot write: p95 under 200 ms
  nightly       a re-score of 10,000 users: under 5 minutes (split across --workers processes)

Numbers depend on the machine; the report says which one. Run it on hardware like production before relying on it.
"""

import argparse
import json
import os
import platform
import statistics
import subprocess  # noqa: S404
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import httpx
from alembic import command
from alembic.config import Config
from redis import Redis
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.util.signing import signed_headers
from simulator.campus import generate

BENCH_DB = "kredo_score_bench"
PORT = 8123
KEY_ID, SECRET = "bench", "bench-only-secret-" + "0" * 20


def pct(xs: list[float], p: float) -> float:
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(len(xs) * p))]


def setup_db(admin_url: str) -> str:
    admin = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as c:
        c.execute(text(f"DROP DATABASE IF EXISTS {BENCH_DB} WITH (FORCE)"))
        c.execute(text(f"CREATE DATABASE {BENCH_DB}"))
    admin.dispose()
    url = make_url(admin_url).set(database=BENCH_DB).render_as_string(hide_password=False)
    cfg = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    cfg.set_main_option("script_location", str(Path(__file__).resolve().parents[1] / "alembic"))
    cfg.attributes["database_url"] = url
    cfg.attributes["configure_logger"] = False
    command.upgrade(cfg, "head")
    return url


def start_api(db_url: str, redis_url: str) -> subprocess.Popen:
    env = {**os.environ, "SCORE_DATABASE_URL": db_url, "SCORE_REDIS_URL": redis_url,
           "SCORE_HMAC_KEYS": json.dumps({KEY_ID: {"secret": SECRET, "sources": ["simulator"]}})}
    proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(PORT),  # noqa: S603
                             "--log-level", "warning"], env=env)
    for _ in range(60):
        try:
            if httpx.get(f"http://127.0.0.1:{PORT}/v1/ready", timeout=1).status_code == 200:
                return proc
        except httpx.HTTPError:
            pass
        time.sleep(0.5)
    proc.terminate()
    raise SystemExit("the bench API did not start")


def signed(client: httpx.Client, method: str, path: str, body: bytes = b"") -> httpx.Response:
    headers = signed_headers(KEY_ID, SECRET, int(time.time()), method, path, body)
    return client.request(method, f"http://127.0.0.1:{PORT}{path}", content=body or None, headers=headers)


def bench_ingest(campus_events: list[dict]) -> dict:
    sent = accepted = 0
    latencies: list[float] = []
    with httpx.Client(timeout=60) as client:
        t0 = time.perf_counter()
        for i in range(0, len(campus_events), 500):
            batch = campus_events[i:i + 500]
            t = time.perf_counter()
            r = signed(client, "POST", "/v1/events", json.dumps({"events": batch}).encode())
            latencies.append((time.perf_counter() - t) * 1000)
            r.raise_for_status()
            sent += len(batch)
            accepted += len(r.json()["accepted"])
        elapsed = time.perf_counter() - t0
        retry = signed(client, "POST", "/v1/events", json.dumps({"events": campus_events[:500]}).encode()).json()
    return {"events": sent, "accepted": accepted, "events_per_s": round(sent / elapsed), "seconds": round(elapsed, 1),
            "p95_batch_ms": round(pct(latencies, 0.95)), "lost": sent - accepted,
            "retry_duplicates": len(retry["duplicate"]), "retry_accepted": len(retry["accepted"])}


def bench_recompute(sm, cfg, user_ids: list[UUID], n: int = 200) -> dict:
    from app.db.repositories import EventRepository
    from app.scoring import snapshots

    ms = []
    now = datetime.now(UTC)
    for uid in user_ids[:n]:
        t = time.perf_counter()
        with sm.begin() as s:
            EventRepository(s).lock_user(uid)
            result = snapshots.compute_for_user(s, uid, now, cfg)
            snapshots.save(s, result, cfg, trigger_event_id=None)
        ms.append((time.perf_counter() - t) * 1000)
    return {"users": len(ms), "p50_ms": round(statistics.median(ms), 1), "p95_ms": round(pct(ms, 0.95), 1)}


def bench_cached_read(user_ids: list[UUID], n: int = 1000) -> dict:
    ms = []
    with httpx.Client(timeout=10) as client:
        for uid in user_ids[:n]:
            t = time.perf_counter()
            r = signed(client, "GET", f"/v1/users/{uid}/score")
            ms.append((time.perf_counter() - t) * 1000)
            r.raise_for_status()
    return {"reads": len(ms), "p50_ms": round(statistics.median(ms), 1), "p95_ms": round(pct(ms, 0.95), 1)}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--users", type=int, default=10_000)
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) // 2))
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    from app.config.loader import load_config
    from app.db.session import make_engine, make_sessionmaker
    from app.scoring import nightly
    from app.settings import get_settings

    settings = get_settings()
    admin_url = make_url(settings.database_url).set(database="postgres").render_as_string(hide_password=False)
    redis_url = settings.redis_url.rsplit("/", 1)[0] + "/13"  # a scratch Redis db
    Redis.from_url(redis_url).flushdb()

    print(f"Building {args.users} simulated students in a scratch database...")
    db_url = setup_db(admin_url)
    campus = generate(seed=args.seed, students=args.users, now=datetime.now(UTC))
    api = start_api(db_url, redis_url)
    results = {}
    try:
        results["ingest"] = bench_ingest(campus.events)
        engine = make_engine(db_url)
        with engine.begin() as c:  # the worker would build these rows from events; the bench scores straight from them
            c.execute(text("INSERT INTO users (id, created_at, synthetic) SELECT user_id, min(occurred_at), true "
                           "FROM events GROUP BY user_id ON CONFLICT DO NOTHING"))
        sm = make_sessionmaker(engine)
        cfg = load_config(settings.scorecard_path, settings.policy_path)
        os.environ["SCORE_DATABASE_URL"], os.environ["SCORE_REDIS_URL"] = db_url, redis_url  # for the shard workers
        get_settings.cache_clear()

        t = time.perf_counter()
        n = nightly.rescore_parallel(args.workers, datetime.now(UTC))
        results["nightly"] = {"users": n, "workers": args.workers, "seconds": round(time.perf_counter() - t, 1),
                              "users_per_s": round(n / (time.perf_counter() - t), 1)}
        with engine.connect() as c:
            ids = [r[0] for r in c.execute(text("SELECT id FROM users ORDER BY random() LIMIT 1000"))]
        results["cached_read"] = bench_cached_read(ids)
        results["recompute"] = bench_recompute(sm, cfg, ids)
    finally:
        api.terminate()
        api.wait(10)

    r = results
    rows = [
        ("ingest bursts of 500 events", ">= 500 events/s, none lost",
         f"{r['ingest']['events_per_s']} events/s, {r['ingest']['lost']} lost, retry stored "
         f"{r['ingest']['retry_accepted']}", r["ingest"]["events_per_s"] >= 500 and r["ingest"]["lost"] == 0
         and r["ingest"]["retry_accepted"] == 0),
        ("cached score read", "p95 < 50 ms", f"p95 {r['cached_read']['p95_ms']} ms (p50 {r['cached_read']['p50_ms']})",
         r["cached_read"]["p95_ms"] < 50),
        ("recompute one user", "p95 < 200 ms", f"p95 {r['recompute']['p95_ms']} ms (p50 {r['recompute']['p50_ms']})",
         r["recompute"]["p95_ms"] < 200),
        (f"nightly re-score of {r['nightly']['users']} users", "< 5 min per 10,000",
         f"{r['nightly']['seconds']} s with {r['nightly']['workers']} workers ({r['nightly']['users_per_s']} users/s)",
         r["nightly"]["seconds"] < 300 * args.users / 10_000 and r["nightly"]["users"] >= args.users),
    ]
    print(f"\nMachine: {platform.platform()}, {os.cpu_count()} cores, Python {platform.python_version()}\n")
    for name, target, got, ok in rows:
        print(f"{'PASS' if ok else 'FAIL'}  {name:38} target {target:28} got {got}")
    out = Path("reports")
    out.mkdir(exist_ok=True)
    (out / "bench.json").write_text(json.dumps({"machine": platform.platform(), "cores": os.cpu_count(),
                                                "users": args.users, **results}, indent=1) + "\n")
    sys.exit(0 if all(ok for *_, ok in rows) else 1)


if __name__ == "__main__":
    main()
