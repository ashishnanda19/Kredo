"""Posts a small, clearly fake event history through the signed API: `python -m app.devtools.seed`.

Phase 1 stand-in. The campus simulator (phase 7) replaces it with ~600 synthetic students. Every event is
`synthetic: true` and ids are uuid5 over fixed names, so re-running the seed is a no-op (all duplicates).
"""

import argparse
import json
import time
from datetime import UTC, date, datetime, timedelta
from uuid import NAMESPACE_URL, uuid5

import httpx

from app.util.signing import signed_headers

DEMO_SECRET = "dev-only-demo-secret-0000000000000000"  # noqa: S105  (matches docker-compose.yml)
START = datetime(2026, 9, 1, 5, 0, tzinfo=UTC)


def _id(name: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"kredo-seed:{name}"))


def _event(n: int, type_: str, user: str, at: datetime, payload: dict) -> dict:
    key = f"seed-{user}-{n:03d}"
    return {
        "event_id": _id(key), "idempotency_key": key, "type": type_, "user_id": _id(user),
        "occurred_at": at.isoformat(), "source": "demo_controls", "synthetic": True, "payload": payload,
    }


def _loan_cycle(user: str, n: int, start: datetime, amount: int, paid_after_days: int) -> list[dict]:
    loan = _id(f"{user}-loan-{n}")
    due = (start + timedelta(days=20)).date()
    paid_at = start + timedelta(days=paid_after_days)
    return [
        _event(n * 10 + 1, "loan_disbursed", user, start,
               {"loan_id": loan, "principal_paise": amount, "fees_paise": 0, "due_date": due.isoformat(),
                "vendor_ids": [_id("fake-campus-cafe")], "limit_paise": 250_000}),
        _event(n * 10 + 2, "spend_made", user, start + timedelta(minutes=2),
               {"loan_id": loan, "vendor_id": _id("fake-campus-cafe"), "amount_paise": amount, "channel": "qr"}),
        _event(n * 10 + 3, "repayment_received", user, paid_at,
               {"loan_id": loan, "amount_paise": amount, "paid_at": paid_at.isoformat(), "rail": "upi"}),
        _event(n * 10 + 4, "loan_closed", user, paid_at + timedelta(minutes=1),
               {"loan_id": loan, "closure_type": "repaid"}),
    ]


def build() -> list[dict]:
    events: list[dict] = []
    for user, kyc in (("fake-student-fresh", "full"), ("fake-student-steady", "full"), ("fake-student-late", "basic")):
        events.append(_event(0, "user_verified", user, START, {
            "kyc_level": kyc, "college_id_verified": True, "college_email_verified": kyc == "full",
            "phone_first_seen_at": date(2025, 1, 15).isoformat(),
        }))
        events.append(_event(1, "consent_changed", user, START, {
            "purpose": "scoring", "granted": True, "text_version": "demo-v1",
        }))
    for i in range(3):
        events += _loan_cycle("fake-student-steady", i + 1, START + timedelta(days=1 + 21 * i), 80_000, 16)
    events += _loan_cycle("fake-student-late", 1, START + timedelta(days=1), 100_000, 32)
    return events


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    args = parser.parse_args()
    body = json.dumps({"events": build()}).encode()
    headers = signed_headers("demo", DEMO_SECRET, int(time.time()), "POST", "/v1/events", body)
    r = httpx.post(f"{args.url}/v1/events", content=body, headers=headers, timeout=10)
    r.raise_for_status()
    out = r.json()
    print(f"seed: {len(out['accepted'])} accepted, {len(out['duplicate'])} already there")


if __name__ == "__main__":
    main()
