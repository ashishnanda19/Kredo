"""Training-data export for the v2 model: `python -m app.monitoring.export_training` (`make export-training`).

Writes a Parquet file with one row per labelled loan: the features and the v1 score AS THEY WERE WHEN THE LOAN WAS
DECIDED (rebuilt from events before the decision, see outcomes.py), and the label. Only loans whose label window has
closed are in it, so there is no unlabelled or half-observed row and nothing the student did later can leak in.

Columns: ids and dates; `bad` and why; `krs_v1`, `pd_v1`, `band_v1`, `aura_v1`, `level_v1`; `principal_paise`; and one
`feat_*` column per feature. The file's metadata records the label version, config hash and counts. Split train and
test BY `user_id` (a student's loans are correlated), and by time, never at random.

It contains internal ids and behaviour only: no names, phone numbers, ID numbers, colleges or other personal data.
It is still sensitive: keep it off shared drives and out of repositories (`data/` is gitignored).
"""

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pyarrow as pa
import pyarrow.parquet as pq
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.loader import EngineConfig, load_config
from app.db.models import Outcome
from app.db.session import make_engine, make_sessionmaker
from app.settings import get_settings


def rows_for(session: Session, label_version: int, synthetic: bool | None) -> list[Outcome]:
    stmt = select(Outcome).where(Outcome.label_version == label_version).order_by(Outcome.decision_at, Outcome.loan_id)
    if synthetic is not None:
        stmt = stmt.where(Outcome.synthetic == synthetic)
    return list(session.scalars(stmt))


def to_table(outcomes: list[Outcome], cfg: EngineConfig, *, label_version: int) -> pa.Table:
    feature_names = sorted({k for o in outcomes for k in o.features})
    cols: dict[str, list[Any]] = {
        "loan_id": [str(o.loan_id) for o in outcomes],
        "user_id": [str(o.user_id) for o in outcomes],
        "synthetic": [o.synthetic for o in outcomes],
        "decision_at": [o.decision_at for o in outcomes],
        "due_date": [o.due_date for o in outcomes],
        "observed_at": [o.observed_at for o in outcomes],
        "bad": [int(o.bad_flag) for o in outcomes],
        "worst_dpd": [o.worst_dpd for o in outcomes],
        "label_reason": [o.reason for o in outcomes],
        "closure_type": [o.closure_type for o in outcomes],
        "principal_paise": [o.principal for o in outcomes],
        "krs_v1": [o.krs for o in outcomes],
        "pd_v1": [o.pd for o in outcomes],
        "band_v1": [o.band for o in outcomes],
        "aura_v1": [o.aura for o in outcomes],
        "level_v1": [o.level for o in outcomes],
        "config_hash": [o.config_hash for o in outcomes],
    }
    for name in feature_names:
        cols[f"feat_{name}"] = [o.features.get(name) for o in outcomes]
    table = pa.table(cols)
    meta = {
        "label_version": str(label_version),
        "label_definition": json.dumps(cfg.policy.monitoring.label.model_dump()),
        "feature_set_version": cfg.scorecard.feature_set_version,
        "scorecard_version": cfg.scorecard.version,
        "rows": str(len(outcomes)),
        "bad": str(sum(o.bad_flag for o in outcomes)),
        "exported_at": datetime.now(UTC).isoformat(),
    }
    return table.replace_schema_metadata({**(table.schema.metadata or {}), **{k.encode(): v.encode() for k, v in
                                                                              meta.items()}})


def export(session: Session, cfg: EngineConfig, out: Path, *, synthetic: bool | None = None,
           label_version: int | None = None) -> dict[str, int]:
    version = label_version or cfg.policy.monitoring.label.version
    outcomes = rows_for(session, version, synthetic)
    if not outcomes:
        raise SystemExit("No labelled loans to export yet (a loan is labelled 60 days after its due date).")
    out.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(to_table(outcomes, cfg, label_version=version), out, compression="zstd")
    return {"rows": len(outcomes), "bad": sum(o.bad_flag for o in outcomes),
            "synthetic": sum(o.synthetic for o in outcomes)}


def main() -> None:
    ap = argparse.ArgumentParser(description="Export labelled loans for the v2 model as Parquet.")
    ap.add_argument("--out", default="data/training.parquet")
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--synthetic-only", action="store_true")
    group.add_argument("--real-only", action="store_true")
    ap.add_argument("--label-version", type=int)
    args = ap.parse_args()
    settings = get_settings()
    cfg = load_config(settings.scorecard_path, settings.policy_path)
    sm = make_sessionmaker(make_engine(settings.database_url))
    with sm() as s:
        counts = export(s, cfg, Path(args.out), synthetic=True if args.synthetic_only else False if args.real_only
                        else None, label_version=args.label_version)
    print(f"wrote {args.out}: {counts['rows']} labelled loans, {counts['bad']} bad "
          f"({counts['synthetic']} synthetic, {counts['rows'] - counts['synthetic']} real)", file=sys.stderr)


if __name__ == "__main__":
    main()
