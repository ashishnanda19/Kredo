"""Demo presets: obviously fake students whose event histories show each Aura state in a pitch.

Each preset builds wire events anchored at `now`, so "35 days overdue" stays true whenever the demo runs. The same
builders feed `POST /v1/demo/presets/{name}` (live demo) and `export_fixtures` (the web app's mock mode), so both show
what the real engine computes. Every event is `synthetic: true` and every id is derived from fake names.
"""

from collections.abc import Callable
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

LIMIT = 250_000  # ₹2,500
AMOUNT = 100_000  # ₹1,000


class Builder:
    def __init__(self, user_id: UUID, now: datetime) -> None:
        self.user_id, self.now, self.wire, self.loans = user_id, now, [], 0

    def _id(self, name: str) -> UUID:
        return uuid5(NAMESPACE_URL, f"kredo-demo:{self.user_id}:{name}")

    def add(self, type_: str, at: datetime, payload: dict[str, Any]) -> "Builder":
        key = f"demo:{self.user_id}:{len(self.wire):04d}"
        self.wire.append({"event_id": str(self._id(key)), "idempotency_key": key, "type": type_,
                          "user_id": str(self.user_id), "occurred_at": at.isoformat(), "source": "demo_controls",
                          "schema_version": 1, "synthetic": True, "payload": payload})
        return self

    def days_ago(self, days: float) -> datetime:
        return self.now - timedelta(days=days)

    def verify(self, days_ago: float) -> "Builder":
        at = self.days_ago(days_ago)
        self.add("user_verified", at, {"kyc_level": "full", "college_id_verified": True, "college_email_verified": True,
                                       "phone_first_seen_at": (at - timedelta(days=400)).date().isoformat()})
        return self.add("consent_changed", at, {"purpose": "scoring", "granted": True, "text_version": "demo-v1"})

    def loan(self, opened_days_ago: float, *, term_days: int = 20, paid_after_days: float | None,
             amount: int = AMOUNT, vendor: str = "fake-campus-cafe") -> str:
        self.loans += 1
        lid = str(self._id(f"loan-{self.loans}"))
        opened = self.days_ago(opened_days_ago)
        due: date = (opened + timedelta(days=term_days)).astimezone(UTC).date()
        self.add("loan_disbursed", opened, {"loan_id": lid, "principal_paise": amount, "fees_paise": 0,
                                            "due_date": due.isoformat(), "vendor_ids": [str(self._id(vendor))],
                                            "limit_paise": LIMIT})
        if paid_after_days is not None:
            paid = opened + timedelta(days=paid_after_days)
            self.add("repayment_received", paid, {"loan_id": lid, "amount_paise": amount, "paid_at": paid.isoformat(),
                                                  "rail": "upi"})
            self.add("loan_closed", paid + timedelta(minutes=1), {"loan_id": lid, "closure_type": "repaid"})
        return lid

    def spend(self, lid: str, vendor: str, amount: int, at: datetime) -> "Builder":
        return self.add("spend_made", at, {"loan_id": lid, "vendor_id": str(self._id(vendor)), "amount_paise": amount,
                                           "channel": "qr"})


def fresh_spawn(b: Builder) -> None:
    """Verified three days ago, no loans yet."""
    b.verify(3)


def locked_in_streak(b: Builder) -> None:
    """Two monthly ₹1,800 loans, each repaid on its due date (band B, a 2-cycle streak), and a third open now."""
    b.verify(80)
    for i in range(2):
        b.loan(70 - 30 * i, paid_after_days=19.5, amount=180_000)
    b.loan(6, paid_after_days=None, amount=115_000)


def late_payer_recovering(b: Builder) -> None:
    """One loan went 12 days past due about four months ago; every loan since has been on time. One is open now."""
    b.verify(200)
    for i in range(6):
        b.loan(190 - 30 * i, paid_after_days=32 if i == 2 else 17)
    b.loan(6, paid_after_days=None)


def knockout_overdue_35(b: Builder) -> None:
    """A ₹1,000 loan, due 35 days ago and still unpaid."""
    b.verify(90)
    b.loan(80, paid_after_days=16)
    b.loan(55, paid_after_days=None)


def collusion_alert(b: Builder) -> None:
    """Three ₹800 spends at one fake vendor in two days, then a refund: the ops queue gets a COLLUSION alert."""
    b.verify(10)
    lid = b.loan(4, amount=240_000, paid_after_days=None)
    for hours in (0, 20, 44):
        b.spend(lid, "fake-collusion-kiosk", 80_000, b.days_ago(4) + timedelta(hours=hours, minutes=5))
    b.add("refund_issued", b.days_ago(4) + timedelta(hours=58),
          {"loan_id": lid, "vendor_id": str(b._id("fake-collusion-kiosk")), "amount_paise": 80_000})


def held_for_review(b: Builder) -> None:
    """Six spends at different stalls inside ten minutes: new loans are held until ops review."""
    b.verify(30)
    b.loan(25, paid_after_days=15)
    lid = b.loan(2, amount=60_000, paid_after_days=None)
    for i in range(6):
        b.spend(lid, f"fake-stall-{i}", 10_000, b.days_ago(2) + timedelta(minutes=1 + 1.5 * i))


def consent_frozen(b: Builder) -> None:
    """Two loans repaid on time, then scoring consent withdrawn: the score is frozen at that moment."""
    b.verify(100)
    b.loan(90, paid_after_days=17)
    b.loan(60, paid_after_days=17)
    b.add("consent_changed", b.days_ago(20), {"purpose": "scoring", "granted": False, "text_version": "demo-v1"})


PRESETS: dict[str, Callable[[Builder], None]] = {
    "fresh_spawn": fresh_spawn,
    "locked_in_streak": locked_in_streak,
    "late_payer_recovering": late_payer_recovering,
    "knockout_overdue_35": knockout_overdue_35,
    "collusion_alert": collusion_alert,
    "held_for_review": held_for_review,
    "consent_frozen": consent_frozen,
}


def build(name: str, user_id: UUID, now: datetime) -> list[dict[str, Any]]:
    b = Builder(user_id, now)
    PRESETS[name](b)
    return b.wire


def fixture_user(name: str) -> UUID:
    """A stable fake id per preset, for the exported fixtures."""
    return uuid5(NAMESPACE_URL, f"kredo-demo-fixture:{name}")
