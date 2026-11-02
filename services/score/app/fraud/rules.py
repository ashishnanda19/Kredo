"""Anti-gaming and fraud rules. Pure functions of the event log: no clock, randomness or I/O.

Each rule returns findings. A finding is one instance of a pattern with a stable `key`, so the same pattern is never
raised twice, and evidence made of ids, amounts, times and counts only (never personal data). Rules only raise alerts
for the ops queue; they never change KRS. Groups are greedy and non-overlapping: once spends or loans are used as
evidence for one instance, the next instance starts after them.
"""

from collections import defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from app.config.schema import FraudPolicy
from app.domain.dpd import ist_date
from app.domain.enums import AlertRule, EventType
from app.domain.records import EventRecord
from app.features.history import History, LoanFacts


@dataclass(frozen=True, slots=True)
class Spend:
    event_id: UUID
    at: datetime
    loan_id: UUID
    vendor_id: UUID
    amount: int
    campus_id: UUID | None = None


@dataclass(frozen=True, slots=True)
class Refund:
    event_id: UUID
    at: datetime
    loan_id: UUID
    vendor_id: UUID
    amount: int


@dataclass(frozen=True, slots=True)
class Finding:
    rule: AlertRule
    key: str  # stable id of this instance; an alert never re-raises a key it already holds
    at: datetime  # when the pattern became visible: the event that completed it
    user_id: UUID | None
    vendor_id: UUID | None = None
    evidence: dict[str, Any] = field(default_factory=dict)

    @property
    def subject(self) -> tuple[AlertRule, UUID | None, UUID | None]:
        return (self.rule, self.user_id, self.vendor_id)

    def as_instance(self) -> dict[str, Any]:
        return {"key": self.key, "at": self.at.isoformat(), **self.evidence}


def _iso(t: datetime) -> str:
    return t.isoformat()


def _hours(a: datetime, b: datetime) -> float:
    return round((b - a).total_seconds() / 3600, 1)


def spends_of(events: Iterable[EventRecord]) -> list[Spend]:
    out = [Spend(e.event_id, e.occurred_at, UUID(e.payload["loan_id"]), UUID(e.payload["vendor_id"]),
                 e.payload["amount_paise"], UUID(c) if (c := e.payload.get("campus_id")) else None)
           for e in events if e.type == EventType.SPEND_MADE]
    return sorted(out, key=lambda s: (s.at, str(s.event_id)))


def refunds_of(events: Iterable[EventRecord]) -> list[Refund]:
    out = [Refund(e.event_id, e.occurred_at, UUID(e.payload["loan_id"]), UUID(e.payload["vendor_id"]),
                  e.payload["amount_paise"]) for e in events if e.type == EventType.REFUND_ISSUED]
    return sorted(out, key=lambda r: (r.at, str(r.event_id)))


def _spend_json(s: Spend) -> dict[str, Any]:
    return {"event_id": str(s.event_id), "loan_id": str(s.loan_id), "amount_paise": s.amount, "at": _iso(s.at)}


# score farming --------------------------------------------------------------------------------------------------------

def farming(h: History, f: FraudPolicy) -> list[Finding]:
    """`min_loans` loans repaid within `quick_days` of disbursal, all repaid inside `window_days`."""
    c = f.farming
    quick = sorted((x for x in h.loans if x.is_quick(c.quick_days)), key=lambda x: (x.paid_in_full_at, str(x.loan_id)))
    out, i = [], 0
    while i + c.min_loans <= len(quick):
        group = quick[i:i + c.min_loans]
        if group[-1].paid_in_full_at - group[0].paid_in_full_at <= timedelta(days=c.window_days):
            out.append(Finding(AlertRule.FARMING, f"farming:{group[0].loan_id}", group[-1].paid_in_full_at, h.user_id,
                               evidence={"signal": "quick_repayments", "loans": [
                                   {"loan_id": str(x.loan_id), "disbursed_at": _iso(x.disbursed_at),
                                    "repaid_at": _iso(x.paid_in_full_at),
                                    "hours_open": _hours(x.disbursed_at, x.paid_in_full_at)} for x in group]}))
            i += c.min_loans
        else:
            i += 1
    return out


# rollover chains ------------------------------------------------------------------------------------------------------

def _rolled(prev: LoanFacts, cur: LoanFacts, within: timedelta) -> bool:
    """Opened before the previous loan was repaid, or within `within` of repaying it (the same test as F5)."""
    repaid = prev.paid_in_full_at
    return repaid is None or cur.disbursed_at <= repaid + within


def rollover_chains(h: History, f: FraudPolicy) -> list[Finding]:
    """Runs of `min_loans`+ loans, each opened within `within_hours` of repaying the one before."""
    c = f.rollover
    within = timedelta(hours=c.within_hours)
    runs: list[list[LoanFacts]] = []
    for loan in h.loans:
        if runs and _rolled(runs[-1][-1], loan, within):
            runs[-1].append(loan)
        else:
            runs.append([loan])
    out = []
    for run in runs:
        if len(run) < c.min_loans:
            continue
        links = [{"loan_id": str(cur.loan_id), "opened_at": _iso(cur.disbursed_at),
                  "hours_after_previous_repaid": _hours(prev.paid_in_full_at, cur.disbursed_at)
                  if prev.paid_in_full_at else None} for prev, cur in zip(run, run[1:], strict=False)]
        out.append(Finding(AlertRule.ROLLOVER, f"chain:{run[0].loan_id}", run[c.min_loans - 1].disbursed_at,
                           h.user_id, evidence={"signal": "rollover_chain", "first_loan_id": str(run[0].loan_id),
                                                "loans_in_chain": len(run), "links": links}))
    return out


# collusion cash-out ---------------------------------------------------------------------------------------------------

def _same_amount(user: UUID, vendor: UUID, spends: Sequence[Spend], f: FraudPolicy) -> list[Finding]:
    c = f.collusion.same_amount
    window = timedelta(days=c.window_days)
    used: set[UUID] = set()
    out = []
    for i, first in enumerate(spends):
        if first.event_id in used:
            continue
        group = [first] + [s for s in spends[i + 1:] if s.event_id not in used and s.at - first.at <= window
                           and abs(s.amount - first.amount) <= c.tolerance * first.amount]
        if len(group) >= c.min_spends:
            used.update(s.event_id for s in group)
            out.append(Finding(AlertRule.COLLUSION, f"same_amount:{first.event_id}", group[c.min_spends - 1].at, user,
                               vendor, {"signal": "same_amount_spends", "spends": [_spend_json(s) for s in group]}))
    return out


def _near_limit(user: UUID, vendor: UUID, flagged: Sequence[tuple[Spend, int]], f: FraudPolicy) -> list[Finding]:
    n = f.collusion.near_limit.min_spends
    out = []
    for i in range(0, len(flagged) - n + 1, n):
        group = flagged[i:i + n]
        out.append(Finding(AlertRule.COLLUSION, f"near_limit:{group[0][0].event_id}", group[-1][0].at, user, vendor,
                           {"signal": "spends_just_under_limit",
                            "spends": [{**_spend_json(s), "available_paise": avail} for s, avail in group]}))
    return out


def _quick_refunds(user: UUID, vendor: UUID, spends: Sequence[Spend], refunds: Sequence[Refund],
                   f: FraudPolicy) -> list[Finding]:
    within = timedelta(hours=f.collusion.refund_within_hours)
    out = []
    for r in refunds:
        spend = next((s for s in reversed(spends) if s.at <= r.at <= s.at + within), None)
        if spend is not None:
            out.append(Finding(AlertRule.COLLUSION, f"refund:{r.event_id}", r.at, user, vendor, {
                "signal": "refund_soon_after_spend", "spend": _spend_json(spend),
                "refund": {"event_id": str(r.event_id), "amount_paise": r.amount, "at": _iso(r.at)},
                "hours_between": _hours(spend.at, r.at)}))
    return out


def collusion(h: History, spends: Sequence[Spend], refunds: Sequence[Refund], f: FraudPolicy) -> list[Finding]:
    """Per student-vendor pair: near-same spends inside a week, spends just under the remaining limit, or a refund
    soon after a spend. Every finding carries both ids, so it shows on the student and on the vendor."""
    limits = {x.loan_id: x.limit for x in h.loans}
    spent: dict[UUID, int] = defaultdict(int)  # per loan, before each spend
    near: dict[UUID, list[tuple[Spend, int]]] = defaultdict(list)
    for s in spends:
        limit = limits.get(s.loan_id)
        if limit:
            available = limit - spent[s.loan_id]
            if available > 0 and s.amount >= f.collusion.near_limit.fraction * available:
                near[s.vendor_id].append((s, available))
        spent[s.loan_id] += s.amount

    by_vendor: dict[UUID, list[Spend]] = defaultdict(list)
    for s in spends:
        by_vendor[s.vendor_id].append(s)
    refunds_by_vendor: dict[UUID, list[Refund]] = defaultdict(list)
    for r in refunds:
        refunds_by_vendor[r.vendor_id].append(r)

    out = []
    for vendor in sorted(set(by_vendor) | set(refunds_by_vendor), key=str):
        vs = by_vendor.get(vendor, [])
        out += _same_amount(h.user_id, vendor, vs, f)
        out += _near_limit(h.user_id, vendor, near.get(vendor, []), f)
        out += _quick_refunds(h.user_id, vendor, vs, refunds_by_vendor.get(vendor, []), f)
    return out


# vendor concentration and surges --------------------------------------------------------------------------------------

def vendor_concentration(user: UUID, spends: Sequence[Spend], f: FraudPolicy) -> list[Finding]:
    """One vendor takes more than `share` of a student's spend over `cycles` consecutive loans with spends."""
    c = f.vendor_anomaly
    cycles: dict[UUID, list[Spend]] = {}
    for s in spends:  # in time order, so loans are ordered by their first spend
        cycles.setdefault(s.loan_id, []).append(s)
    loans = list(cycles.items())
    out, i = [], 0
    while i + c.cycles <= len(loans):
        window = loans[i:i + c.cycles]
        per_vendor: dict[UUID, int] = defaultdict(int)
        for _, ss in window:
            for s in ss:
                per_vendor[s.vendor_id] += s.amount
        total = sum(per_vendor.values())
        vendor, top = max(per_vendor.items(), key=lambda kv: (kv[1], str(kv[0])))
        if top > c.share * total:
            last = max(s.at for _, ss in window for s in ss)
            out.append(Finding(AlertRule.VENDOR_ANOMALY, f"concentration:{window[0][0]}", last, user, vendor, {
                "signal": "vendor_concentration", "share": round(top / total, 3), "vendor_paise": top,
                "total_paise": total, "loan_ids": [str(lid) for lid, _ in window]}))
            i += c.cycles
        else:
            i += 1
    return out


def week_start(t: datetime) -> date:
    """Monday of the India-time week containing t."""
    d = ist_date(t)
    return d - timedelta(days=d.weekday())


def vendor_surge(vendor: UUID, week: date, this_week: int, last_week: int, at: datetime,
                 f: FraudPolicy) -> Finding | None:
    """A vendor's Kredo volume this IST week is more than `surge_ratio` times last week's. A vendor with no volume
    last week has no baseline and is not flagged. (Kredo volume stands in for "Kredo share of sales" until partners
    report vendors' total sales.)"""
    c = f.vendor_anomaly
    if last_week <= 0 or this_week < c.surge_min_week_paise or this_week <= c.surge_ratio * last_week:
        return None
    return Finding(AlertRule.VENDOR_ANOMALY, f"surge:{week.isoformat()}", at, None, vendor, {
        "signal": "vendor_volume_surge", "week_start": week.isoformat(), "this_week_paise": this_week,
        "last_week_paise": last_week, "ratio": round(this_week / last_week, 2)})


# velocity -------------------------------------------------------------------------------------------------------------

def velocity(user: UUID, spends: Sequence[Spend], f: FraudPolicy) -> list[Finding]:
    """More than `max_spends` spends inside `window_minutes`, or spends on more than `max_campuses_per_day` campuses
    in one IST day."""
    c = f.velocity
    window = timedelta(minutes=c.window_minutes)
    out, i = [], 0
    while i < len(spends):
        j = i
        while j + 1 < len(spends) and spends[j + 1].at - spends[i].at <= window:
            j += 1
        if j - i + 1 > c.max_spends:
            burst = spends[i:j + 1]
            out.append(Finding(AlertRule.VELOCITY, f"burst:{spends[i].event_id}", burst[c.max_spends].at, user,
                               evidence={"signal": "spend_burst", "spends_in_window": len(burst),
                                         "window_minutes": c.window_minutes,
                                         "spends": [_spend_json(s) for s in burst]}))
            i = j + 1
        else:
            i += 1

    days: dict[date, list[Spend]] = defaultdict(list)
    for s in spends:
        if s.campus_id is not None:
            days[ist_date(s.at)].append(s)
    for day, ss in sorted(days.items()):
        seen: set[UUID] = set()
        for s in ss:
            seen.add(s.campus_id)
            if len(seen) > c.max_campuses_per_day:
                out.append(Finding(AlertRule.VELOCITY, f"campuses:{day.isoformat()}", s.at, user, evidence={
                    "signal": "many_campuses_one_day", "day": day.isoformat(),
                    "campuses": len({x.campus_id for x in ss}), "spends": [_spend_json(x) for x in ss]}))
                break
    return out


# identity rings -------------------------------------------------------------------------------------------------------

def ring(kind: str, digest: str, accounts: Iterable[tuple[UUID, datetime]]) -> list[Finding]:
    """One finding per account sharing this identifier, each listing the others. Only a digest prefix is kept."""
    accounts = sorted(accounts, key=lambda a: (a[1], str(a[0])))
    if len(accounts) < 2:
        return []
    at = accounts[1][1]  # when the identifier was first shared
    ids = [a[0] for a in accounts]
    return [Finding(AlertRule.RING, f"{kind}:{digest[:16]}", max(at, seen), user, evidence={
        "signal": "shared_identifier", "kind": kind, "digest_prefix": digest[:8],
        "linked_accounts": [str(x) for x in ids if x != user]}) for user, seen in accounts]


# all per-student rules ------------------------------------------------------------------------------------------------

def per_student(events: Sequence[EventRecord], f: FraudPolicy) -> list[Finding]:
    """Every rule that needs only this student's own events. Rings and vendor surges look across accounts and run
    in app/fraud/service.py."""
    h = History.build(events)
    spends, refunds = spends_of(events), refunds_of(events)
    return (farming(h, f) + rollover_chains(h, f) + collusion(h, spends, refunds, f)
            + vendor_concentration(h.user_id, spends, f) + velocity(h.user_id, spends, f))
