.PHONY: install up stack down reset migrate api worker seed seed-api simulate rescore label report export-training bench test test-unit lint fmt openapi fixtures

install:            ## local virtualenv with dev tools
	uv sync

up:                 ## Postgres and Redis only (for tests and local api/worker)
	docker compose up -d --wait postgres redis

stack:              ## everything in Docker: Postgres, Redis, migrations, API, worker
	docker compose up -d --build --wait

down:
	docker compose down

reset:              ## drop the local volumes too
	docker compose down -v

migrate:
	uv run alembic upgrade head

api:
	uv run uvicorn app.main:app --reload --port 8000

worker:
	uv run python -m app.events.worker

seed:               ## the simulated campus: 600 fake students, 30 vendors, 6 months (needs `make up` + `make migrate`)
	uv run python -m simulator.load

seed-api:           ## a handful of fake events through the signed API (smoke test of a running stack)
	uv run python -m app.devtools.seed

simulate:           ## same, with options, e.g. make simulate ARGS="--students 120 --seed 7"
	uv run python -m simulator.load $(ARGS)

rescore:            ## the nightly job: re-score everyone, then label loans whose window closed (WORKERS=4 to split)
	uv run python -m app.scoring.nightly --workers $(or $(WORKERS),1)

label:              ## only the outcome labelling (also part of rescore)
	uv run python -m app.monitoring.outcomes

report:             ## weekly monitoring report into reports/ (add COHORTS=data/cohorts.csv for the fairness check)
	uv run python -m app.monitoring.report $(if $(COHORTS),--cohorts $(COHORTS),)

export-training:    ## labelled loans, features at decision time, as Parquet (data/training.parquet)
	uv run --group export python -m app.monitoring.export_training $(ARGS)

bench:              ## the performance targets, against the running API and the loaded database
	uv run python -m simulator.bench $(ARGS)

test: up
	uv run pytest

test-unit:
	uv run pytest tests/unit

lint:
	uv run ruff check .

fmt:
	uv run ruff check . --fix

openapi:            ## writes openapi.json and regenerates the web app's TypeScript types from it
	uv run python -c "import json; from app.main import create_app; print(json.dumps(create_app().openapi(), indent=2))" > openapi.json
	cd ../.. && npx openapi-typescript services/score/openapi.json -o lib/score/api-types.ts

fixtures:           ## regenerates the web app's mock-mode data (lib/score/fixtures.json) from the real engine
	uv run python -m app.devtools.export_fixtures
