# Kredo score service

The risk engine behind Aura. It computes the Kredo Risk Score (KRS, 0 to 1000, never shown to students), its implied
probability of default, a risk band, reason codes, knockouts and a limit recommendation. The lending partner makes
every credit decision; this service only recommends. KRS is Kredo's own in-app score, not a credit bureau score.

**Status: all 7 phases built.** Ingest, scoring, the limit ladder, partner precheck and outcome, maker-checker
overrides, the audit log, config dry-run, fraud rules and the alert queue, the web app's Aura and ops APIs, and (phase
7) the campus simulator, outcome labels, monitoring and weekly report, the training export and the runbook. Read
[Known gaps](#known-gaps) before relying on any of it, and [RUNBOOK.md](RUNBOOK.md) before operating it.

## Architecture

```
 lending partner ─┐                                                     ┌─ Next.js BFF ── students (Aura)
 demo controls ───┼─► POST /v1/events ──► events (append-only)          │   strips krs, pd, band, points
 simulator ───────┘   HMAC-signed,        + outbox, one transaction     ├─ Next.js BFF ── ops risk console
                      idempotent                 │                      │   ops JWT per role
                                                 ▼                      │
                                   relay ──► Redis stream ──► scorer ───┤   GET /v1/users/{id}/score ◄─ cache
                                                              │         │   (Redis, rebuilt from Postgres)
                       one transaction per event, per-user lock:        │
                       project ► fraud rules ► score ► snapshot ────────┘
                                                 │
        Postgres: events · score_snapshots · audit_log · decisions · outcomes  (append-only, trigger-enforced)
                  users · loans · repayments · spends · identity_links         (read model, rebuilt from events)
                  fraud_alerts · overrides · limit_ladder_state                (ops state)

 nightly:  re-score everyone (sharded) ► label loans whose window closed ► outcomes (features at decision time)
 weekly:   monitoring report (drift, calibration, Gini/KS, roll rates, alerts, fairness)
 on demand: make export-training ► Parquet for the v2 model
```

The scorer is a pure function: `score(events, as_of, config)` has no clock, randomness or I/O, so any snapshot can be
replayed exactly. The lending partner decides every loan; this service only recommends.

## Run it

```bash
docker compose up -d --build --wait   # Postgres 16, Redis 7, migrations, API on :8000, worker
make seed                             # the simulated campus: 600 fake students, 6 months (about 90 s)
make test                             # unit and integration tests (starts Postgres and Redis if needed)
```

`make seed` needs the local Python environment (`uv` creates it on first use) and talks to the Docker Postgres and
Redis on their published ports. `make stack` is a shortcut for the first line. API docs:
http://localhost:8000/v1/docs. Ports: Postgres 55433, Redis 56380 (chosen to avoid clashing with local installs). To
run the API or worker outside Docker: `make up`, copy `.env.example` to `.env`, then `make migrate`, `make api` and
`make worker`.

| Command | What it does |
|---|---|
| `make seed` / `make simulate ARGS="--students 120"` | Load the simulated campus (once; `make reset` for a fresh start) |
| `make seed-api` | A handful of fake events through the signed API: a smoke test of a running stack |
| `make rescore WORKERS=4` | The nightly job: re-score everyone, then label loans whose window closed |
| `make report COHORTS=data/cohorts.csv` | The weekly monitoring report into `reports/` |
| `make export-training` | Labelled loans as Parquet in `data/training.parquet` |
| `make bench` | The performance targets, in a scratch database |
| `make fixtures` / `make openapi` | Regenerate the web app's mock data and TypeScript types |

## How an event flows

1. A caller (the lending partner, or the demo controls until one exists) signs a request and posts one event or a
   batch of up to 500 events to `POST /v1/events`.
2. The event and an `outbox` row are written in one transaction. A retry with the same `idempotency_key` and body comes
   back as `duplicate`. The same key with a different body is a `409`, and nothing in that batch is written.
3. The worker's relay publishes outbox rows to the Redis stream `kredo:score-events`.
4. The `scorer` consumer group handles each message in its own transaction, under a per-user advisory lock. It
   rebuilds the read-model rows (users, vendors, loans, repayments, failed attempts, consents, spends, identifier
   links) from the event log, so the result does not depend on arrival order. Failed messages are retried, then sent
   to `kredo:score-events:dlq` after 5 deliveries.
5. Still in that transaction, the fraud rules run and may raise alerts (see below).
6. In the same transaction the user is rescored from their whole event log, and a `score_snapshots` row and a
   `feature_vectors` row are written. After commit the latest score is cached in Redis (`score:latest:{user_id}`); an
   older snapshot can never overwrite a newer one.

`make rescore` (the nightly job) snapshots everyone as of now, because time alone moves scores: overdue days age and
old events decay.

## How a score is made

`app/scoring/engine.py`: `score(events, as_of, config)`. Pure and deterministic, with no clock, randomness or I/O.

- **Features** (`app/features/`, one module per family) are values computed from the event history at a point in
  time. **Points** for each value come from `app/config/scorecard_v1.yaml`. KRS = clamp(500 + points, 0, 1000).
- **PD** = 1 / (1 + 20 × 2^((KRS − 500) / 40)). **Band** comes from `policy_default.yaml` (A ≥ 680 … E < 440).
- **Velocity cap**: KRS rises at most 60 in any rolling 30 days, evaluated day by day from the first event, so it is
  still a pure function of the events. F3 (current overdue) sits outside the cap so paying an overdue amount helps at
  once.
- **Knockouts** (`app/scoring/knockouts.py`) pause new loans without changing KRS. Each has a plain message and a way
  out. Withdrawn scoring consent freezes the score at the moment of withdrawal (`KO_CONSENT`).
- **Aura** = clamp(floor((KRS − 400) / 4), 0, 100). The tier comes from the band, so it never contradicts it.
- **Reason codes**: top 3 up and top 3 down by points, plus `THIN_FILE`.

Every snapshot stores the feature values, the points and bin per factor, the exact input event ids, and the versions
and hash of the config, so `snapshots.replay()` reproduces it exactly. `GET /v1/users/{id}/score/explain` shows all of
it.

### Limits: the ladder, the partner, and overrides

- **Ladder** (`app/scoring/ladder.py`, numbers in `policy_default.yaml`): L1 ₹1,000 up to L6 ₹10,000. A verified
  student in band A–C starts at L1. Moving up needs clean cycles at the current level, a minimum band, sometimes
  months on Kredo, and 30 days since the last step. A loan at 8+ days past due drops a level; one at 31+ freezes the
  ladder until it is repaid and two clean cycles follow. Like the score, it is recomputed from events every time, and
  promotions are checked only at fixed points (repayments, day ends), so a later score never rewrites an earlier one.
- **The partner decides.** `POST /v1/decisions/precheck` returns a fresh recommendation (eligible, band, level, max
  ticket = limit minus what is owed) and logs it; `POST /v1/decisions/{loan_id}/outcome` records what the partner
  actually did and how it compares. Both go to the append-only `decisions` table.
- **Overrides** (`/v1/ops/overrides`): a risk analyst proposes; a *different* risk admin approves, rejects or revokes
  (also enforced by a database constraint). Approval writes an internal `override_approved` event, so the override is
  an ordinary scoring input and snapshots replay exactly. Overrides change only the limit recommendation (cap, level,
  pause), never KRS, band or Aura. They expire on their own (90 days at most). Every step is in `audit_log`.
- **Ops auth**: ops calls are HMAC-signed by the BFF and carry a short-lived HS256 JWT (`sub` = actor id, `role`).
  Roles: the web app's ops roles plus `risk_analyst` and `risk_admin` (`app/api/ops_auth.py`).

### Fraud and anti-gaming alerts

Rules live in `app/fraud/rules.py` (pure functions of the event log) and their thresholds in the `fraud:` section of
`policy_default.yaml`. They raise alerts for people to review; they never change KRS.

| Alert | Fires when | Severity | Confirming it |
| --- | --- | --- | --- |
| `FARMING` | more than 4 loans repaid within 3 days of disbursal, inside 30 days | low | records it; F1 and F9 already discount these loans |
| `COLLUSION` | one student and one vendor: 3+ near-same spends in 7 days, 2+ spends just under what was left on the loan, or a refund within 48 hours of a spend. One alert carries both ids | high | KO_FRAUD |
| `VENDOR_ANOMALY` | one vendor takes over 60% of a student's spend across 3 loans, or a vendor's Kredo volume jumps more than 3x week on week (IST weeks) | medium | records it |
| `VELOCITY` | more than 5 spends in 10 minutes, or spends on 2+ campuses in one IST day. **Holds new loans until reviewed** | high | KO_FRAUD |
| `RING` | the same device, payout account or phone digest on more than one account. Each account gets an alert | high | KO_DUPLICATE |
| `ROLLOVER` | 3+ loans in a row, each opened within 24 hours of repaying the last | low | records it; support can offer help |

- **One open alert per rule, student and vendor.** Each finding has a stable key. A key an alert already holds is never
  raised again, so a dismissed pattern stays dismissed; new findings join the open alert, or open a new one once the
  last was resolved.
- **The queue** (`/v1/ops/fraud-alerts`, plus `/v1/ops/vendors/{id}/fraud-signals` for a vendor's alerts across
  students): `PATCH` with an action and a written reason (10+ characters, kept in the alert and the audit log, never in
  the event log). `fraud` or `risk_admin` confirm or dismiss. Confirming a rule that has a `confirm_flag` writes that
  flag as an internal event, which becomes the knockout. Lifting it is maker-checker: someone asks
  (`request_lift`), a *different* risk admin approves or rejects.
- **The hold** is a `SPEND_HOLD` flag event written when a velocity alert opens, tied to that alert. It pauses new
  loans (`limit_reco.action = held_for_review`) without a knockout or any score change, and is released when the alert
  is dismissed or confirmed. Flags pair up on (type, alert), and `POST /v1/events` refuses flags that name an alert,
  so a caller cannot clear what ops set.

### What the web app reads (phase 5)

- `GET /v1/users/{id}/score` adds `ladder_levels` (from the active policy) and `evaluated_at` (when a frozen score
  froze). `limit_reco.open_loans` lists what is still owed, loan by loan.
- `GET /v1/users/{id}/score/history?from&to`: daily Aura (IST days, from the same capped daily series as the score, so
  the line never disagrees with the number) plus markers: repaid early, on time or late, and level up or down.
- `POST /v1/score/simulate`: Aura now, and projected at `horizon` if the student repays or closes one of their own open
  loans (from now up to 120 days ahead). Nothing is saved. Every option is projected to the same horizon, so options
  differ only by what the student does, not by when the score is read (decay and the velocity cap move scores over
  time).
- `POST /v1/demo/presets/{name}`: a new fake student with one of seven histories (`app/devtools/presets.py`): fresh
  spawn, Locked In streak, late payer recovering, knockout 35 days overdue, collusion alert, held for review, consent
  withdrawn. Off unless `SCORE_DEMO_PRESETS=true` and the key may send `demo_controls` events.
- `make fixtures` writes `lib/score/fixtures.json` (the web app's mock mode) by scoring the same presets with the real
  engine, minus internal fields. A test fails if the committed file is stale.
- `make openapi` writes `openapi.json` and regenerates `lib/score/api-types.ts`.

### The ops risk console's API (phase 6)

All under `/v1/ops`, signed by the BFF with an ops JWT. Per-student views need `risk_analyst`, `risk_admin`, `admin`
or `fraud`; aggregates are open to every ops role.

- `GET /users?band&tier&knockout&q&sort&limit&offset`: each student's latest snapshot, riskiest first.
- `GET /users/{id}`: the latest snapshot with points per factor (a waterfall from 500 to KRS), feature values,
  knockouts with their way out, the last 30 snapshots with what changed between them, the last 200 events, ladder
  state, alerts and overrides. `POST /users/{id}/simulate` is the student what-if with KRS and band shown.
- `GET /monitoring`: band and Aura distribution, tiers, knockouts, precheck and approval rates with agreement, DPD
  roll rates (current → 1-7 → 8-30 → 31+, each loan's highest DPD so far), open alerts and confirm rate per rule,
  minutes since the last event, and v2 readiness (loans past their 60-day label window; bad = 30+ DPD in it or a
  negative closure).
- `GET /audit?target=override:{id}|fraud_alert:{id}`: the audit trail for one override or alert.
- `GET /config` also returns the deployed YAML files as text.
- `make fixtures` also writes `lib/score/ops-fixtures.json` (the console's read-only mock mode) with the same shaping
  code (`app/ops/risk.py`).

### The simulated campus (phase 7)

`simulator/campus.py` builds a fake campus from a fixed seed: **600 students, 30 vendors, 6 months**, about 740 loans
and 7,350 events. Archetypes follow the spec: reliable 60%, forgetful 25%, stretched 10%, fraud 5%. The 30 fraud
students are built to trip each rule: 8 farmers (5 or 6 loans each repaid within a day), 8 collusion students on 4
shared kiosks, 5 velocity bursts, and 9 in identity rings of three. Everything is obviously fake: ids come from
`uuid5` over readable names, every event is `synthetic: true` with source `simulator`, and the event contract has no
field for a name, phone number or college. The same arguments always give the same campus.

The simulator is not the lending partner and does not consult the engine, so how the engine scores it is a real
test. `simulator/load.py` (`make seed`) replays the events in time order through the same steps the worker runs,
each as of its own time, so the history, alerts and snapshots are what production would have produced. It also does a
monthly re-score, records the partner's prechecks and decisions, labels outcomes and warms the cache. Loaded events
are marked published in the outbox, so a running worker does not redo them.

### Monitoring, labels and the v2 data (phase 7)

- **Labels** (`app/monitoring/labels.py`, thresholds in `monitoring.label`): a loan is labelled 60 days after its due
  date, and is bad if it reached 30+ days past due in that window or was settled, restructured or written off by
  then. `label_version` is 1; change the definition only with a new version.
- **Outcomes** (`outcomes` table, append-only): one row per labelled loan with the label **and the score and
  features the loan had when it was decided**, rebuilt by replaying only the events before the decision. Nothing the
  student did afterwards can leak in (a test proves it).
- **Monitoring** (`GET /v1/ops/monitoring`, `make report`): KRS drift as PSI month on month (alert above 0.25, and no
  PSI at all below 100 students in a month, because PSI on a handful of students is noise); calibration (predicted PD
  against observed bad rate per band, with a reliability flag under 20 loans); Gini and KS on labelled loans; roll
  rates; approval and agreement with the partner; alerts and confirm rate per rule; data freshness; v2 readiness.
- **Fairness check** (report only): eligibility and band rates by cohort from a `user_id,cohort` file (for example
  year of study). Cohorts are not scored, the file is read and never stored, cohorts under 20 are hidden, and a flag
  is a prompt for a person to look.
- **Training export** (`make export-training`): Parquet with one row per labelled loan, `feat_*` columns, `krs_v1`,
  `pd_v1`, `band_v1` and the label; the file's metadata records the label definition and config hash. Split by
  `user_id` and by time. It needs `pyarrow` (the `export` dependency group; not in the Docker image).

### Performance

`make bench` builds a scratch database with 10,000 simulated students and its own API process, and checks each target:

| Target | Measured | Machine |
|---|---|---|
| ingest bursts of 500 events/s, none lost | 4,766 events/s, 0 lost, a full retry stored nothing | 11-core Apple laptop, Postgres and Redis in Docker |
| cached score read p95 < 50 ms | p95 5.3 ms (p50 1.2 ms) | same |
| recompute one user p95 < 200 ms | p95 18 ms (p50 11 ms), including the snapshot write | same |
| nightly re-score of 10,000 users < 5 min | 31 s with 5 worker processes (323 users/s) | same |

These are laptop numbers, with short per-student histories (about 12 events). Run `make bench` on hardware like
production, and again once students have longer histories.

### Known gaps

1. **Farming still works over a few weeks.** In the simulated campus all 8 farmers end at KRS 670 to 675 (band B, Aura
   about 68, eligible) after 5 or 6 loans each repaid within a day, above essentially every honest student (average
   519). The spec's "short loans count 0.25" does not stop a farmer who has *only* short loans, because F1 is a ratio
   and the weights cancel; the velocity cap only slows the climb. The `FARMING` alert (low severity) fires, but nothing
   acts on it. A strict expected-failure test records this (`test_farmers_do_not_outrank_honest_students`). It is a
   design decision, not a quick fix: any scorecard rule that discounts quick repayment penalises honest early
   repayers, which the ethics rules forbid, and thin-file is deliberately timing-independent so that repaying sooner can
   never lower a score. **Decision (2026-11-02): `quick_repay.weight` stays at 0.25.** Changing it cannot fix
   this (F1 is a ratio, so any weight cancels) and raising it to 1.0 would remove the only discount that keeps quick
   loans from inflating the track record. A candidate that keeps KRS monotone is to treat an open FARMING alert as a block on ladder
   step-ups (not on the score, and not on lending) until a person reviews it. Not built; needs a decision.
2. **Calibration on the simulated data is off** (band C predicted 2.9%, observed 6.9%; band D 5.1% against 13%). That
   says nothing about the scorecard: the simulator's behaviour was not derived from it. It shows the monitoring works.
   Real calibration needs real loans (about 500 expected in the pilot, so most bands will have too few for a while).
3. **No DPDP export or erasure endpoints.** The service keeps no names, phone numbers or ID numbers, but it does keep
   keyed digests of devices, payout accounts and phones inside append-only events. Deleting those is impossible by
   design; what an erasure request should do (for example, destroying the partner-side key that links digests to a
   person) needs a decision with legal advice before launch.
4. **Ops sign-in is a demo role switcher,** and the student's identity in the web app is a demo cookie. Real
   authentication must replace both before anyone real uses it.
5. **Vendor surge uses Kredo's volume at a vendor,** not its share of sales, until partners report total sales. In a
   growing pilot it will raise many vendor alerts; tune `fraud.vendor_anomaly` through the dry-run flow.
6. **Fraud rules will flag some honest students** (near-same spends, spending just under the limit). Watch the confirm
   rate per rule in the report before trusting a rule.
7. **There is no lending partner yet.** The "partner" in prechecks and outcomes is the demo key, and the simulator
   plays one. Keep the "Demo preview, no real money" tag until a real NBFC exists.

### Changing a threshold safely

1. Edit the YAML on a branch. The loader refuses anything that breaks a safety rail.
2. `POST /v1/ops/config/dry-run` with the new YAML (risk role). It rescores everyone seen in the last 90 days and
   returns band, level and eligibility changes with masked ids. Nothing goes live.
3. Run `make fixtures` so the web demo shows the new numbers.
4. Merge and deploy. The new config is registered by hash in `config_versions`; old snapshots keep replaying with the
   config they were built with.

### Safety rails, enforced by tests

- **Config**: the loader refuses YAML whose points break a rail (for example more lateness earning points), whose
  bins are out of order, or whose fraud `confirm_flag` is not a knockout flag.
- **Property tests** (`tests/property`, 300 random histories each): paying on time, paying sooner, fewer failures and
  lower utilisation never lower KRS; arrival order never changes it; the cap holds.
- **Golden personas** (`tests/golden`): Aanya, Rohan, Meera, Rahul, Kabir, Farhan and the Collusion pair, with
  expectations read from the YAML.
- **Fraud rules** (`tests/unit/test_fraud_rules.py`): every rule has firing and non-firing cases, and ordinary
  personas raise nothing.
- **No protected inputs**: a test fails if any feature or event field names a protected or proxy attribute.

## Contracts

- **Signing.** Send `X-Kredo-Key-Id`, `X-Kredo-Timestamp` (Unix seconds, within 5 minutes) and `X-Kredo-Signature`.
  The signature is the hex HMAC-SHA256 of `"{timestamp}\n{METHOD}\n{path?query}\n{sha256_hex(body)}"`. Each key is
  bound to the event sources it may send, so the demo key cannot post as `nbfc`. See `app/util/signing.py`.
- **Events.** 18 public types (`app/events/schemas.py`); `override_*` events are written only by the service. Money is
  integer paise in fields ending `_paise`, and every timestamp must carry a timezone. Unknown fields are rejected, so
  nothing outside the contract, such as names, phone numbers or protected attributes, can enter the log.
  `mandate_bounce` is refused while `FEATURE_MANDATES=false`.
- **Idempotency.** The body hash ignores `event_id` and null fields, so a retry with a fresh id, or from a sender that
  does not know a newer optional field, is a duplicate rather than a conflict.
- **`identifier_seen`** carries `kind` (device, payout_account, phone) and a 64-hex `digest`. The sender computes it as
  HMAC-SHA256 of the raw value under a key Kredo never holds, so Kredo can match accounts but never learn the value.
- **`spend_made.campus_id`** is an optional opaque id, read only by the velocity rule and never by the scorecard (a
  test checks it cannot move KRS).
- **Days past due** are counted in India time (IST): a repayment at 23:30 IST on the due date is on time.

## Data rules

- `events`, `score_snapshots`, `audit_log` and `decisions` are append-only. A database trigger rejects UPDATE, DELETE
  and TRUNCATE.
- Rows are keyed by internal user id. Events carry no names, phone numbers or ID numbers; devices, payout accounts and
  phones arrive only as keyed digests, and alert evidence keeps just an 8-character prefix.
- Alert evidence is ids, amounts, times and counts. Ops notes stay in `fraud_alerts` and `audit_log`, never in the
  event log.
- Logs emit a fixed list of id fields only (`app/logs.py`), never payloads.
- Seed and test data are marked `synthetic: true`, with obviously fake identifiers.

## Layout

```
app/
  main.py        app factory and routers
  settings.py    environment config (SCORE_* variables)
  domain/        enums, IST days-past-due maths, the pure loan-state fold
  events/        schemas, ingest, outbox relay, consumer, projector, worker, internal (service-written events)
  features/      one module per feature family
  scoring/       scorecard, calibration, knockouts, Aura, reasons, ladder, limits, snapshots
  fraud/         anti-gaming and fraud rules (pure) and the service that raises alerts
  ops/           audit log, overrides, fraud alert queue, config dry-run
  api/           HTTP routes, HMAC auth, ops roles
  db/            models, repositories (all writes go through these)
  monitoring/    outcome labels, drift/calibration/Gini maths, report, training export, the shared overview
  devtools/      seed, demo presets, web fixture export
simulator/       the fake campus, its loader, and the performance benchmark
RUNBOOK.md       schedules, what to watch, incidents, rotation, recalibration, training v2
alembic/         migrations (0001 every table and the append-only triggers; 0002 decisions, config versions, ladder;
                 0003 fraud alert lifecycle, spends, identifier links)
tests/unit       no infrastructure needed
tests/integration  fresh database per test, cloned from a migrated template
```
