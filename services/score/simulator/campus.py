"""A fake campus: 600 students, 30 vendors, 6 months of events, from a fixed random seed. Pure: no database, no clock
(pass `now`), so the same arguments always give the same events.

Everything is obviously fake. Ids are uuid5 over readable names ("kredo-sim:42:student:17"), every event is
`synthetic: true` with source `simulator`, and no name, phone number or college ever appears (the event contract has
no field for them). Archetypes follow Part B: reliable 60%, forgetful 25%, stretched 10%, fraud 5%. The fraud group
is built to trip each fraud rule: farmers, collusion pairs, velocity bursts and identity rings.

The simulator is not the lending partner and does not consult the engine: it decides who borrows, how much and how
they repay. How the engine scores that behaviour is exactly what the simulated campus is for.
"""

import hashlib
import random
from collections import Counter
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from app.domain.dpd import IST

ARCHETYPES = (("reliable", 0.60), ("forgetful", 0.25), ("stretched", 0.10), ("fraud", 0.05))
LIMIT_L1, LIMIT_L2 = 100_000, 200_000  # ₹1,000 and ₹2,000, the first two ladder levels
FEE_RATE = 0.02
KIOSKS = 4  # the last vendors are the collusion kiosks


@dataclass
class Student:
    user_id: UUID
    index: int
    archetype: str
    subtype: str = ""
    join_day: int = 0
    cohort: str = ""  # year of study: held outside the scoring pipeline, only for the fairness check
    loans: int = 0


@dataclass
class Campus:
    seed: int
    now: datetime
    start: datetime
    events: list[dict[str, Any]]
    students: list[Student]
    vendors: list[UUID]
    cohorts: dict[str, str] = field(default_factory=dict)

    def summary(self) -> dict[str, Any]:
        types = Counter(e["type"] for e in self.events)
        return {"students": len(self.students), "vendors": len(self.vendors), "events": len(self.events),
                "loans": types["loan_disbursed"], "by_type": dict(sorted(types.items())),
                "by_archetype": dict(Counter(s.archetype for s in self.students))}


def _day(now: datetime, days: int) -> date:
    return now.astimezone(IST).date() - timedelta(days=days)


def digest(kind: str, value: str) -> str:
    """A fake identifier digest (the real one is the partner's keyed hash). Obviously not derived from a real value."""
    return hashlib.sha256(f"kredo-sim-fake-{kind}:{value}".encode()).hexdigest()


class _Sim:
    def __init__(self, seed: int, now: datetime, days: int, vendors: int) -> None:
        self.seed, self.now, self.days = seed, now, days
        self.rng = random.Random(seed)
        self.start = datetime.combine(_day(now, days), time(0), IST)
        self.vendors = [uuid5(NAMESPACE_URL, f"kredo-sim:{seed}:vendor:{i}") for i in range(vendors)]
        self.campuses = [uuid5(NAMESPACE_URL, f"kredo-sim:{seed}:campus:{i}") for i in range(2)]
        self.events: list[dict[str, Any]] = []
        self.counter: Counter[int] = Counter()
        self.loan_no: Counter[int] = Counter()

    # emitting ---------------------------------------------------------------------------------------------------
    def when(self, day: float, hour: float | None = None) -> datetime:
        """A moment `day` days after the start, at a random daytime hour in India (or the given hour)."""
        d = self.start.date() + timedelta(days=int(day // 1))
        h = self.rng.uniform(8, 21.5) if hour is None else hour
        return datetime.combine(d, time(int(h), int((h % 1) * 60)), IST)

    def emit(self, s: Student, type_: str, at: datetime, payload: dict[str, Any]) -> bool:
        if at > self.now:
            return False  # the campus only knows the past
        n = self.counter[s.index]
        self.counter[s.index] += 1
        key = f"sim{self.seed}-{s.index:04d}-{n:04d}"
        self.events.append({
            "event_id": str(uuid5(NAMESPACE_URL, key)), "idempotency_key": key, "type": type_,
            "user_id": str(s.user_id), "occurred_at": at.isoformat(), "source": "simulator", "schema_version": 1,
            "synthetic": True, "payload": payload,
        })
        return True

    def vendor(self, i: int) -> UUID:
        return self.vendors[i]

    # onboarding -------------------------------------------------------------------------------------------------
    def onboard(self, s: Student, kyc: str | None = None, phone_days: int | None = None) -> datetime:
        at = self.when(s.join_day)
        kyc = kyc or ("full" if self.rng.random() < 0.85 else "basic")
        age = phone_days if phone_days is not None else (self.rng.randint(10, 60) if self.rng.random() < 0.08
                                                         else self.rng.randint(120, 1200))
        self.emit(s, "user_verified", at, {
            "kyc_level": kyc, "college_id_verified": True, "college_email_verified": kyc == "full",
            "phone_first_seen_at": (at.astimezone(IST).date() - timedelta(days=age)).isoformat()})
        self.emit(s, "consent_changed", at, {"purpose": "scoring", "granted": True, "text_version": "sim-v1"})
        self.device(s, f"student-{s.index}", at)
        return at

    def device(self, s: Student, value: str, at: datetime, kind: str = "device") -> None:
        self.emit(s, "identifier_seen", at + timedelta(minutes=1), {"kind": kind, "digest": digest(kind, value)})

    # loans ------------------------------------------------------------------------------------------------------
    def split(self, principal: int, parts: int) -> list[int]:
        cuts = sorted(self.rng.uniform(0.15, 0.85) for _ in range(parts - 1))
        edges = [0.0, *cuts, 1.0]
        amounts = [max(1000, round(principal * (b - a))) for a, b in zip(edges, edges[1:], strict=False)]
        amounts[-1] = principal - sum(amounts[:-1])
        return amounts

    def open_loan(self, s: Student, opened: datetime, *, term: int, principal: int, limit: int,
                  spends: list[tuple[UUID, int, datetime]] | None = None, campus: UUID | None = None,
                  decided_hours_before: float = 2) -> dict[str, Any] | None:
        """Application, approval, disbursal and the spends. Returns the loan's facts, or None if it is in the future."""
        s.loans += 1
        self.loan_no[s.index] += 1
        loan = str(uuid5(NAMESPACE_URL, f"kredo-sim:{self.seed}:loan:{s.index}:{self.loan_no[s.index]}"))
        fees = round(principal * FEE_RATE)
        due = opened.astimezone(IST).date() + timedelta(days=term)
        applied = opened - timedelta(hours=decided_hours_before + 0.5)
        self.emit(s, "loan_applied", applied, {"loan_id": loan, "requested_amount_paise": principal})
        self.emit(s, "loan_decided", opened - timedelta(hours=decided_hours_before),
                  {"loan_id": loan, "decision": "approved", "decided_by": "nbfc", "reason_codes": []})
        picks = spends or []
        if not picks:
            favourites = s_fav(self, s)
            for amount in self.split(principal, self.rng.choice([1, 2, 2, 3])):
                picks.append((self.vendor(self.rng.choices(favourites, [6, 3, 1][:len(favourites)])[0]), amount,
                              opened + timedelta(days=self.rng.uniform(0, 4), minutes=2)))
        vendor_ids = sorted({str(v) for v, _, _ in picks})
        if not self.emit(s, "loan_disbursed", opened, {
                "loan_id": loan, "principal_paise": principal, "fees_paise": fees, "due_date": due.isoformat(),
                "vendor_ids": vendor_ids, "limit_paise": limit}):
            return None
        home = campus or self.campuses[s.index % 2]
        for v, amount, at in picks:
            self.emit(s, "spend_made", at, {"loan_id": loan, "vendor_id": str(v), "amount_paise": amount,
                                            "channel": "qr", "campus_id": str(home)})
        return {"loan": loan, "due": due, "owed": principal + fees, "principal": principal, "opened": opened}

    def decline(self, s: Student, at: datetime, amount: int) -> None:
        loan = str(uuid5(NAMESPACE_URL, f"kredo-sim:{self.seed}:declined:{s.index}:{self.counter[s.index]}"))
        self.emit(s, "loan_applied", at - timedelta(hours=1), {"loan_id": loan, "requested_amount_paise": amount})
        self.emit(s, "loan_decided", at, {"loan_id": loan, "decision": "declined", "decided_by": "nbfc",
                                          "reason_codes": ["POLICY"]})

    def pay(self, s: Student, ln: dict[str, Any], offset: float, *, amount: int | None = None,
            closing: str | None = "auto") -> datetime:
        """A repayment `offset` days from the due date; closes the loan unless `closing` is None."""
        due_at = datetime.combine(ln["due"], time(0), IST)
        at = due_at + timedelta(days=offset, hours=self.rng.uniform(9, 21))
        amount = amount or ln["owed"]
        if self.emit(s, "repayment_received", at, {"loan_id": ln["loan"], "amount_paise": amount,
                                                   "paid_at": at.isoformat(), "rail": "upi"}) and closing:
            kind = ("prepaid" if offset <= -2 else "repaid") if closing == "auto" else closing
            self.emit(s, "loan_closed", at + timedelta(minutes=1), {"loan_id": ln["loan"], "closure_type": kind})
        return at

    def fail(self, s: Student, ln: dict[str, Any], at: datetime, cls: str = "insufficient_funds") -> None:
        self.emit(s, "payment_failed", at, {"loan_id": ln["loan"], "amount_paise": ln["owed"],
                                            "failure_class": cls, "rail": "upi"})


def s_fav(sim: _Sim, s: Student) -> list[int]:
    """A student's favourite vendors (stable per student; the kiosks are never favourites)."""
    r = random.Random(f"{sim.seed}:fav:{s.index}")
    return r.sample(range(len(sim.vendors) - KIOSKS), 3)


def _offset(sim: _Sim, archetype: str) -> tuple[str, float]:
    """How a loan ends: (kind, days from the due date). Kinds: full, unpaid, settled, restructured."""
    r, rng = sim.rng.random(), sim.rng
    if archetype == "reliable":
        return "full", (1 if r < 0.05 else -rng.choices(range(0, 7), [8, 8, 20, 20, 18, 14, 12])[0])
    if archetype == "forgetful":
        if r < 0.50:
            return "full", rng.randint(-3, 1)
        if r < 0.85:
            return "full", rng.randint(2, 15)
        return "full", (rng.randint(16, 29) if r < 0.97 else rng.randint(30, 45))
    # stretched, and the ring members who behave like them
    if r < 0.15:
        return "full", rng.randint(-1, 1)
    if r < 0.45:
        return "full", rng.randint(3, 25)
    if r < 0.65:
        return "full", rng.randint(30, 50)
    if r < 0.80:
        return "unpaid", 0
    if r < 0.90:
        return "settled", rng.randint(40, 70)
    return "restructured", 35


def _finish(sim: _Sim, s: Student, ln: dict[str, Any], archetype: str, *,
            allow_failure: bool = True) -> datetime | None:
    """Plays out a loan's repayment. Returns when it was cleared, or None if it was not (still open or written off),
    in which case the student does not borrow again."""
    kind, off = _offset(sim, archetype)
    rng = sim.rng
    if kind == "full":
        if allow_failure and archetype != "reliable" and rng.random() < 0.14:
            due_at = datetime.combine(ln["due"], time(12), IST)
            sim.fail(s, ln, due_at + timedelta(days=max(off, 0) - rng.randint(1, 2)), rng.choice(
                ["insufficient_funds", "insufficient_funds", "declined", "technical"]))
        if off > 1 and archetype != "reliable" and rng.random() < 0.10:
            due_at = datetime.combine(ln["due"], time(12), IST)
            sim.emit(s, "promise_to_pay_set", due_at + timedelta(days=1), {
                "loan_id": ln["loan"], "promised_date": (ln["due"] + timedelta(days=3)).isoformat()})
            sim.emit(s, "promise_to_pay_broken", due_at + timedelta(days=4), {
                "loan_id": ln["loan"], "promised_date": (ln["due"] + timedelta(days=3)).isoformat()})
        if archetype != "reliable" and rng.random() < 0.12:  # pays in two parts
            sim.pay(s, ln, min(off, 0), amount=ln["owed"] // 2, closing=None)
            at = sim.pay(s, ln, off + 1, amount=ln["owed"] - ln["owed"] // 2)
        else:
            at = sim.pay(s, ln, off)
        return at if at <= sim.now else None
    if kind == "settled":
        at = sim.pay(s, ln, off, amount=round(ln["owed"] * rng.uniform(0.55, 0.75)), closing="settled")
        return at if at <= sim.now else None
    if kind == "restructured":
        at = sim.pay(s, ln, off, amount=ln["owed"] // 3, closing="restructured")
        return at if at <= sim.now else None
    # never paid: written off 95 days after the due date, if that has already happened
    sim.emit(s, "loan_closed", datetime.combine(ln["due"] + timedelta(days=95), time(10), IST),
             {"loan_id": ln["loan"], "closure_type": "written_off"})
    return None


def _borrower(sim: _Sim, s: Student, archetype: str, *, max_loans: int, decline_rate: float) -> None:
    rng = sim.rng
    at = sim.onboard(s)
    t = (at - sim.start).total_seconds() / 86400 + rng.uniform(0, 25)
    if archetype == "stretched":  # asks for more, early and often
        for _ in range(rng.randint(2, 4)):
            sim.emit(s, "limit_increase_requested", sim.when(t + rng.uniform(0, 20)),
                     {"requested_limit_paise": rng.choice([300_000, 400_000, 500_000])})
    made = 0
    while made < max_loans and sim.start + timedelta(days=t) < sim.now:
        opened = sim.when(t)
        if rng.random() < decline_rate:
            sim.decline(s, opened, rng.choice([80_000, 100_000]))
            t += rng.uniform(5, 15)
            continue
        limit = LIMIT_L1 if made < 2 else LIMIT_L2
        share = rng.uniform(0.9, 1.0) if archetype == "stretched" else rng.uniform(0.35, 0.9)
        ln = sim.open_loan(s, opened, term=rng.choice([15, 20, 25, 30]), principal=int(limit * share) // 100 * 100,
                           limit=limit)
        if ln is None:
            return
        made += 1
        cleared = _finish(sim, s, ln, archetype)
        if cleared is None:
            return  # still open or written off: no new loan
        # stretched students reopen within hours of repaying (a rollover chain); the others come back later
        gap = rng.uniform(0.02, 0.8) if archetype == "stretched" else rng.uniform(1, 25)
        t = (cleared - sim.start).total_seconds() / 86400 + gap


# the fraud group ---------------------------------------------------------------------------------------------------

def _farmer(sim: _Sim, s: Student) -> None:
    at = sim.onboard(s, kyc="full")
    t = (at - sim.start).total_seconds() / 86400 + 1
    for i in range(sim.rng.randint(5, 6)):
        ln = sim.open_loan(s, sim.when(t + 3 * i), term=15, principal=100_000, limit=LIMIT_L1)
        if ln is None:
            return
        sim.pay(s, ln, -14)  # repaid the next day


def _collusion(sim: _Sim, s: Student, kiosk: int) -> None:
    at = sim.onboard(s, kyc="full")
    t = (at - sim.start).total_seconds() / 86400 + 1
    opened = sim.when(t)
    amount = sim.rng.choice([30_000, 32_000, 33_000])
    picks = [(sim.vendor(len(sim.vendors) - 1 - kiosk), amount, opened + timedelta(hours=h, minutes=5))
             for h in (0, 20, 44)]
    ln = sim.open_loan(s, opened, term=20, principal=100_000, limit=LIMIT_L1, spends=picks)
    if ln is None:
        return
    sim.emit(s, "refund_issued", opened + timedelta(hours=58),
             {"loan_id": ln["loan"], "vendor_id": str(picks[0][0]), "amount_paise": amount})
    # cash out and disappear: the loan is never repaid


def _velocity(sim: _Sim, s: Student) -> None:
    at = sim.onboard(s, kyc="full")
    t = (at - sim.start).total_seconds() / 86400 + 1
    opened = sim.when(t, 11)
    picks = [(sim.vendor(sim.rng.randrange(len(sim.vendors) - KIOSKS)), sim.rng.randint(9_000, 15_000),
              opened + timedelta(hours=3, minutes=1.4 * i)) for i in range(sim.rng.randint(6, 7))]
    ln = sim.open_loan(s, opened, term=20, principal=sum(a for _, a, _ in picks), limit=LIMIT_L1, spends=picks)
    if ln is not None and sim.rng.random() < 0.5:
        sim.pay(s, ln, sim.rng.randint(0, 12))


def _ring_member(sim: _Sim, s: Student, ring: int) -> None:
    sim.onboard(s)
    sim.device(s, f"ring-{ring}", sim.when(s.join_day), "device")  # the same device on every account in the ring
    _borrower_after_onboard(sim, s)


def _borrower_after_onboard(sim: _Sim, s: Student) -> None:
    rng = sim.rng
    t = s.join_day + rng.uniform(0, 10)
    for made in range(rng.randint(1, 2)):
        ln = sim.open_loan(s, sim.when(t), term=20, principal=rng.randint(90, 100) * 1000,
                           limit=LIMIT_L1 if made < 2 else LIMIT_L2)
        if ln is None:
            return
        cleared = _finish(sim, s, ln, "stretched")
        if cleared is None:
            return
        t = (cleared - sim.start).total_seconds() / 86400 + rng.uniform(0.02, 0.8)


def generate(*, seed: int = 42, students: int = 600, vendors: int = 30, days: int = 180,
             now: datetime | None = None) -> Campus:
    now = (now or datetime.now(UTC)).astimezone(UTC)
    sim = _Sim(seed, now, days, vendors)
    rng = sim.rng

    n_fraud = max(1, round(students * 0.05)) if students >= 40 else 0
    n_stretched, n_forgetful = round(students * 0.10), round(students * 0.25)
    kinds = (["fraud"] * n_fraud + ["stretched"] * n_stretched + ["forgetful"] * n_forgetful
             + ["reliable"] * (students - n_fraud - n_stretched - n_forgetful))
    rng.shuffle(kinds)
    people = [Student(uuid5(NAMESPACE_URL, f"kredo-sim:{seed}:student:{i}"), i, k, join_day=rng.randint(0, 80),
                      cohort=f"year {rng.randint(1, 4)}") for i, k in enumerate(kinds)]

    fraud = [p for p in people if p.archetype == "fraud"]
    # of 30 fraud students: 8 farmers (5 or 6 quick loans), 8 collusion, 5 velocity bursts, 9 in rings of 3
    plan = (["farmer"] * round(n_fraud * 0.27) + ["collusion"] * round(n_fraud * 0.27)
            + ["velocity"] * round(n_fraud * 0.17))
    plan += ["ring"] * (len(fraud) - len(plan))
    for p, sub in zip(fraud, plan, strict=True):
        p.subtype = sub
    for p in people:
        if p.archetype == "reliable":
            if rng.random() < 0.75:
                _borrower(sim, p, "reliable", max_loans=rng.choice([1, 1, 1, 2, 2]), decline_rate=0.02)
            else:
                sim.onboard(p)
        elif p.archetype == "forgetful":
            if rng.random() < 0.75:
                _borrower(sim, p, "forgetful", max_loans=rng.choice([1, 1, 1, 2, 2]), decline_rate=0.05)
            else:
                sim.onboard(p)
        elif p.archetype == "stretched":
            _borrower(sim, p, "stretched", max_loans=rng.choice([1, 2, 3, 4]), decline_rate=0.15)
    rings = [p for p in fraud if p.subtype == "ring"]
    for i, p in enumerate(fraud):
        if p.subtype == "farmer":
            _farmer(sim, p)
        elif p.subtype == "collusion":
            _collusion(sim, p, kiosk=(i // 2) % KIOSKS)
        elif p.subtype == "velocity":
            _velocity(sim, p)
    for i, p in enumerate(rings):
        _ring_member(sim, p, ring=i // 3)

    # a couple of students withdraw their scoring consent, so the "frozen" state shows up in the console
    for p in [p for p in people if p.archetype == "reliable" and p.loans][:2]:
        sim.emit(p, "consent_changed", sim.when(days - 40), {"purpose": "scoring", "granted": False,
                                                              "text_version": "sim-v1"})

    sim.events.sort(key=lambda e: (datetime.fromisoformat(e["occurred_at"]), e["event_id"]))
    return Campus(seed=seed, now=now, start=sim.start, events=sim.events, students=people, vendors=sim.vendors,
                  cohorts={str(p.user_id): p.cohort for p in people})
