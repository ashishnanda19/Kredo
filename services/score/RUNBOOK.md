# Score service runbook

For whoever runs this service. Commands are from `services/score`. Dev-only values (ports, secrets) are in
`docker-compose.yml` and `.env.example`; never reuse them anywhere real.

## What runs

| Process | Command | What it does |
|---|---|---|
| API | `uvicorn app.main:app` | Ingest, score reads, partner and ops endpoints. Stateless: run several. |
| Worker | `python -m app.events.worker` | Publishes the outbox to Redis, then scores each event. Retries stuck messages every 30 s. Run two for safety; users are locked per event. |
| Nightly job | `make rescore WORKERS=4` | Re-scores every student, then labels loans whose window closed. |
| Weekly report | `make report COHORTS=...` | The monitoring report in `reports/`. |

Postgres is the source of truth. Redis holds the event stream and a cache of each student's latest score; **both
can be lost without losing data** (see "Redis lost").

## Schedules

Use cron, a scheduler container, or your platform's scheduled jobs.

```cron
# 02:00 India time (20:30 UTC the evening before), after the day's last events
30 20 * * *   cd services/score && make rescore WORKERS=4
# Mondays 08:00 India time (UTC 02:30)
30 2 * * 1    cd services/score && make report COHORTS=/secure/path/cohorts.csv
```

The re-score is needed even when nothing happens: overdue days age and old events decay, so scores move with time.
Measured on a laptop, 10,000 students took 31 s across 5 workers (see "Performance" in the README).

## What to watch

| Signal | Where | Worry when |
|---|---|---|
| Data freshness | `GET /v1/ops/monitoring` → `freshness_minutes`, or the report | Rising during working hours: events are not arriving (partner outage, bad key, API down). |
| Dead-letter stream | `redis-cli XLEN kredo:score-events:dlq` | Anything above 0. |
| Pending messages | `redis-cli XPENDING kredo:score-events scorer` | Growing: the worker is down or failing. |
| Outbox backlog | `select count(*) from outbox where published_at is null` | Above a few hundred for more than a minute: the relay is stuck. |
| KRS drift | report, "Drift"; console overview | The alert line says PSI above 0.25: the students being scored have changed. |
| Open fraud alerts | console overview | A queue that only grows: nobody is reviewing it. |
| Readiness | `GET /v1/ready` (database, redis, config) | Anything false. |

Logs are JSON with ids only, never payloads or personal data. Do not add fields to `app/logs.py` without checking.

## When something goes wrong

**Events are not being scored (stream pending grows).** Check the worker is up and its logs for `event_failed`.
Messages retry; after 5 deliveries they move to `kredo:score-events:dlq` with the original fields. Fix the cause, then
re-queue by re-inserting their outbox rows (the consumer is idempotent, so reprocessing changes nothing):
`insert into outbox (event_id) select event_id from events where event_id in (...)`.

**Outbox backlog.** The relay runs inside the worker. Restart the worker; rows are claimed with `SKIP LOCKED`, so two
workers never publish the same row twice.

**Redis lost or flushed.** Scores are served from the database when the cache misses (slower, still correct). Run
`make rescore` to warm the cache and recreate the stream group is automatic. To rebuild the read model from the
event log (users, loans, repayments, spends, identifier links), clear those tables and re-insert every outbox row:
`tests/integration/test_pipeline.py::test_arrival_order_does_not_change_the_result` does exactly this and proves the
result is identical. Never touch `events`, `score_snapshots`, `audit_log`, `decisions` or `outcomes`: triggers refuse
updates, deletes and truncates.

**Explaining or reproducing a score.** `GET /v1/users/{id}/score/explain`, or in Python
`snapshots.replay(session, snapshot)`: it reloads the config by the snapshot's hash and gets the same KRS from the same
event ids. If it ever differs, treat it as an incident: something non-deterministic entered the engine.

**A student disputes a score.** They use "About Aura" in the app; the request lands in support. To investigate use the
risk console (`/ops/risk/users/{id}`): points per factor, the snapshots before and after, the events. A correction
to an event is a *new* event (events are never edited). A limit adjustment is a maker-checker override.

**Fraud alert queue.** `fraud` and `risk_admin` confirm or dismiss with a written reason. Confirming collusion or
velocity sets the fraud knockout; lifting it needs a second person. A velocity alert holds new loans until someone
resolves it, so an unattended queue blocks students: staff it.

## Keys and secrets

- **Partner and BFF HMAC keys** (`SCORE_HMAC_KEYS`): each key id is bound to the event sources it may send. To rotate,
  add a new key id, move the caller over, then remove the old one. Requests are rejected outside a 5-minute clock skew.
- **Ops JWT secret** (`SCORE_OPS_JWT_SECRET`): shared only with the web app's server. Rotating it invalidates tokens in
  flight (they last 2 minutes), so rotate during a quiet moment.
- Production values come from your secret store, never the repo. `.env` is gitignored; compose values are dev-only.
- The identifier digests (device, payout account, phone) are keyed by the *partner*. Kredo cannot recover the raw value.

## Changing the scorecard or policy

Every threshold is in `app/config/*.yaml`. The safe order is in the README ("Changing a threshold safely"): edit on a
branch, dry-run it in the console (`/ops/risk/config`) to see who would change band, run `make fixtures` so the demo
matches, review, deploy. The loader refuses configs that break a safety rail (non-monotone points, out-of-order bins,
bureau points outside −60..+40, a ladder that falls).

**Never change the label definition in place.** `monitoring.label` (window, bad DPD) defines what "bad" means for the
v2 training data. Change it only together with a new `version`: old outcomes keep their old version and are never
mixed in.

## Quarterly recalibration

1. `make report` and open the Calibration table. A band's rate is only shown as reliable above
   `monitoring.calibration.min_loans_per_band` labelled loans (20).
2. Compare predicted PD with the observed bad rate for each reliable band. A persistent gap (observed well above
   predicted, as the simulated campus shows) means the points table is too generous for that band.
3. Adjust points in `scorecard_v1.yaml`, dry-run it, run `make fixtures`, review and deploy. One change at a time;
   keep the report from before the change.
4. Look at Gini and KS. They should hold or improve. With few bad loans they are noisy: read them with the count.

## Training v2

Not before about 1,500 labelled loans including at least 100 bad ones (the overview shows progress). Then:
`make export-training` writes `data/training.parquet` with each loan's features and v1 score *as known when the loan was
decided* and the label. Split by `user_id` and by time, never at random. Train a logistic regression or a monotone
gradient-boosted model, run it in shadow beside v1, and replace v1 only after reviewing calibration, Gini, KS and the
fairness table. The file has no personal data but is sensitive: keep it off shared drives and out of repositories.

## Fairness review

`make report COHORTS=file.csv` (columns `user_id,cohort`, for example year of study) adds eligibility and band rates by
cohort. Cohorts are **not scored** and the file is read, never stored. Cohorts under 20 students are hidden. A `REVIEW`
flag means a person should look at why; nothing changes automatically.

## Local development

```bash
docker compose up -d --build --wait   # Postgres, Redis, migrations, API, worker
make seed                             # 600 simulated students, 6 months (about 90 seconds)
make report COHORTS=data/cohorts.csv  # the weekly report, from the simulated data
make bench                            # the performance targets, in a scratch database
make reset                            # drop the local volumes for a clean start
```

The simulated campus is fake end to end (see "The simulated campus" in the README). Never load it next to real data.
