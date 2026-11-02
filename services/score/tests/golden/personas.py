"""Golden personas: fixed, obviously fake event histories with known shapes.

Every amount is in paise; every id is uuid5 over a readable name. All loans are ₹1,000 against a ₹2,500 limit (40%
utilisation) unless a persona says otherwise.
"""

import hashlib
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta

from app.domain.enums import EventType  # noqa: F401  (re-exported for tests)
from app.domain.records import EventRecord
from tests.factories import event, record, uid

START = datetime(2026, 1, 5, 5, 0, tzinfo=UTC)  # 10:30 IST
LIMIT = 250_000
AMOUNT = 100_000


@dataclass
class Persona:
    name: str
    wire: list[dict] = field(default_factory=list)
    loans: int = 0

    @property
    def user_id(self):
        return uid(self.name)

    def add(self, type_: EventType, at: datetime, payload: dict) -> "Persona":
        n = len(self.wire)
        self.wire.append(event(type_, self.name, payload, at, key=f"{self.name}-{n:04d}"))
        return self

    def verify(self, at: datetime = START, kyc: str = "full", phone: date | None = date(2025, 1, 1)) -> "Persona":
        self.add(EventType.USER_VERIFIED, at, {
            "kyc_level": kyc, "college_id_verified": True, "college_email_verified": kyc == "full",
            "phone_first_seen_at": phone.isoformat() if phone else None,
        })
        return self.add(EventType.CONSENT_CHANGED, at, {"purpose": "scoring", "granted": True, "text_version": "v1"})

    def loan(self, opened: datetime, *, term_days: int = 20, paid_after_days: float | None = None,
             amount: int = AMOUNT, limit: int | None = LIMIT, closure: str | None = "repaid") -> str:
        """Disburse a loan; repay it in full `paid_after_days` after opening (None: leave it unpaid)."""
        self.loans += 1
        loan = f"{self.name}-loan-{self.loans}"
        lid = str(uid(loan))
        due = (opened + timedelta(days=term_days)).astimezone(UTC).date()
        self.add(EventType.LOAN_DISBURSED, opened, {
            "loan_id": lid, "principal_paise": amount, "fees_paise": 0, "due_date": due.isoformat(),
            "vendor_ids": [str(uid("fake-cafe"))], "limit_paise": limit,
        })
        if paid_after_days is not None:
            paid = opened + timedelta(days=paid_after_days)
            self.add(EventType.REPAYMENT_RECEIVED, paid, {"loan_id": lid, "amount_paise": amount,
                                                          "paid_at": paid.isoformat(), "rail": "upi"})
            if closure:
                self.add(EventType.LOAN_CLOSED, paid + timedelta(minutes=1), {"loan_id": lid, "closure_type": closure})
        return lid

    def spend(self, loan_id: str, vendor: str, amount: int, at: datetime, campus: str | None = None) -> "Persona":
        return self.add(EventType.SPEND_MADE, at, {"loan_id": loan_id, "vendor_id": str(uid(vendor)),
                                                   "amount_paise": amount, "channel": "qr",
                                                   "campus_id": str(uid(campus)) if campus else None})

    def refund(self, loan_id: str, vendor: str, amount: int, at: datetime) -> "Persona":
        return self.add(EventType.REFUND_ISSUED, at, {"loan_id": loan_id, "vendor_id": str(uid(vendor)),
                                                      "amount_paise": amount})

    def identifier(self, kind: str, value: str, at: datetime = START) -> "Persona":
        """A fake identifier, digested the way a partner would (here: sha256 of a made-up string)."""
        digest = hashlib.sha256(f"fake-{kind}:{value}".encode()).hexdigest()
        return self.add(EventType.IDENTIFIER_SEEN, at, {"kind": kind, "digest": digest})

    def records(self) -> list[EventRecord]:
        return [record(w) for w in self.wire]


def aanya() -> Persona:
    """Fresh Spawn: verified with full KYC, no loans."""
    return Persona("fresh-spawn-aanya").verify()


def rohan(loans: int = 6) -> Persona:
    """Steady: one loan a month, 4 paid a few days before the due date, 2 paid early, 40% utilisation."""
    p = Persona("steady-rohan").verify()
    for i in range(loans):
        p.loan(START + timedelta(days=2 + 30 * i), paid_after_days=10 if i in (1, 4) else 18)
    return p


def meera(clean_after: int = 0) -> Persona:
    """Like Rohan, but loan 3 went 12 days past due. `clean_after` adds clean monthly loans after the history."""
    p = Persona("recovering-meera").verify()
    for i in range(6 + clean_after):
        p.loan(START + timedelta(days=2 + 30 * i), paid_after_days=32 if i == 2 else (10 if i in (1, 4) else 18))
    return p


def rahul() -> Persona:
    """Rollover: Rohan's repayment pattern, but every loan is reopened within hours of repaying the last."""
    p = Persona("rollover-rahul").verify()
    opened = START + timedelta(days=2)
    for i in range(6):
        paid_after = 10 if i in (1, 4) else 18
        p.loan(opened, paid_after_days=paid_after)
        opened = opened + timedelta(days=paid_after, hours=3)
    return p


def kabir() -> Persona:
    """Overdue: one loan still unpaid 35 days after its due date."""
    p = Persona("overdue-kabir").verify()
    p.loan(START + timedelta(days=2), paid_after_days=None)
    return p


def farhan(loans: int = 10) -> Persona:
    """Farmer: ten loans in ten days, each repaid the next day."""
    p = Persona("farmer-farhan").verify()
    for i in range(loans):
        p.loan(START + timedelta(days=30 + i), paid_after_days=1)
    return p


COLLUSION_VENDOR = "collusion-vendor"


def collusion_pair() -> Persona:
    """A student and a vendor cashing out: three ₹800 spends at one vendor inside two days, then a refund of one of them
    the next morning (₹2,500 limit)."""
    p = Persona("collusion-student").verify()
    opened = START + timedelta(days=3)
    lid = p.loan(opened, amount=240_000, paid_after_days=None)
    for hours in (0, 20, 44):
        p.spend(lid, COLLUSION_VENDOR, 80_000, opened + timedelta(hours=hours, minutes=5))
    return p.refund(lid, COLLUSION_VENDOR, 80_000, opened + timedelta(hours=58))
