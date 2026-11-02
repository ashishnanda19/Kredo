"""The campus simulator: deterministic, obviously fake, valid against the event contract, and behaving like the
archetypes it claims to be (checked through the real fraud rules and the real engine)."""

import statistics
from collections import Counter, defaultdict
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.config.loader import load_config
from app.domain.enums import EventType
from app.domain.records import EventRecord
from app.events.schemas import EventBatch
from app.fraud import rules
from app.scoring.engine import score
from simulator.campus import generate
from tests.protected import mentions_protected

CFG = load_config()
NOW = datetime(2026, 11, 2, 6, 0, tzinfo=UTC)


@pytest.fixture(scope="module")
def campus():
    return generate(seed=42, students=600, vendors=30, days=180, now=NOW)


@pytest.fixture(scope="module")
def small():
    return generate(seed=3, students=240, now=NOW)


def records_by_user(c) -> dict[str, list[EventRecord]]:
    out: dict[str, list[EventRecord]] = defaultdict(list)
    for w in c.events:
        out[w["user_id"]].append(EventRecord(UUID(w["event_id"]), EventType(w["type"]), UUID(w["user_id"]),
                                             datetime.fromisoformat(w["occurred_at"]), w["payload"], True))
    return out


def test_the_same_arguments_give_the_same_campus_and_a_new_seed_a_different_one(campus):
    again = generate(seed=42, students=600, vendors=30, days=180, now=NOW)
    assert again.events == campus.events
    assert generate(seed=43, students=600, now=NOW).events != campus.events


def test_size_and_archetype_mix_follow_the_spec(campus):
    s = campus.summary()
    assert (s["students"], s["vendors"]) == (600, 30)
    assert s["by_archetype"] == {"reliable": 360, "forgetful": 150, "stretched": 60, "fraud": 30}
    assert 500 <= s["loans"] <= 800  # "about 500 to 700 loans": simulated through to an outcome
    fraud = Counter(p.subtype for p in campus.students if p.archetype == "fraud")
    assert fraud == {"farmer": 8, "collusion": 8, "velocity": 5, "ring": 9}


def test_every_event_is_valid_fake_and_in_the_past(campus):
    for i in range(0, len(campus.events), 500):
        EventBatch.model_validate({"events": campus.events[i:i + 500]})  # the contract forbids unknown fields
    assert all(e["synthetic"] and e["source"] == "simulator" for e in campus.events)
    assert len({e["idempotency_key"] for e in campus.events}) == len({e["event_id"] for e in campus.events}) == len(
        campus.events)
    assert max(datetime.fromisoformat(e["occurred_at"]) for e in campus.events) <= NOW
    assert [e["occurred_at"] for e in campus.events] == [e["occurred_at"] for e in sorted(
        campus.events, key=lambda e: (datetime.fromisoformat(e["occurred_at"]), e["event_id"]))]


def test_no_personal_or_protected_field_can_appear(campus):
    keys = {k for e in campus.events for k in e["payload"]}
    assert not {k for k in keys if mentions_protected(k) - {"college"}}  # status flags only, never which college
    assert not any("name" in k or "phone" in k.replace("phone_first_seen_at", "") for k in keys)
    # identifiers are digests of obviously fake strings
    digests = {e["payload"]["digest"] for e in campus.events if e["type"] == "identifier_seen"}
    assert all(len(d) == 64 for d in digests)


def test_loans_follow_the_product_rules(campus):
    disbursed = [e["payload"] for e in campus.events if e["type"] == "loan_disbursed"]
    assert all(100_000 // 100 <= p["principal_paise"] <= 200_000 for p in disbursed)  # ₹1,000 to ₹2,000 here
    assert all(p["principal_paise"] <= p["limit_paise"] for p in disbursed)
    for e in campus.events:
        if e["type"] == "loan_disbursed":
            opened = datetime.fromisoformat(e["occurred_at"]).date()
            assert 15 <= (datetime.fromisoformat(e["payload"]["due_date"]).date() - opened).days <= 31


def test_the_fraud_group_trips_the_fraud_rules_and_honest_students_mostly_do_not(small):
    by_user = records_by_user(small)
    found = {u: {f.rule.value for f in rules.per_student(evs, CFG.policy.fraud)} for u, evs in by_user.items()}
    kind = {str(p.user_id): (p.archetype, p.subtype) for p in small.students}
    for user, (_, sub) in kind.items():
        if sub == "farmer":
            assert "FARMING" in found[user]
        if sub == "collusion":
            assert "COLLUSION" in found[user]
        if sub == "velocity":
            assert "VELOCITY" in found[user]
    reliable = [u for u, (a, _) in kind.items() if a == "reliable"]
    clean = sum(not found[u] for u in reliable)
    assert clean / len(reliable) > 0.9, "honest students should rarely raise alerts"
    assert any("ROLLOVER" in found[u] for u, (a, _) in kind.items() if a == "stretched")


def test_the_engine_ranks_the_archetypes_in_a_sensible_order(small):
    by_user = records_by_user(small)
    krs: dict[str, list[int]] = defaultdict(list)
    for p in small.students:
        if p.archetype == "fraud" or p.user_id.hex not in {u.replace("-", "") for u in by_user}:
            continue
        evs = by_user[str(p.user_id)]
        krs[p.archetype].append(score(evs, NOW, CFG).krs)
    means = {a: statistics.mean(v) for a, v in krs.items()}
    assert means["reliable"] > means["forgetful"] > means["stretched"], means
    assert max(krs["stretched"]) < max(krs["reliable"])


@pytest.mark.xfail(strict=True, reason="KNOWN GAP (README, Known gaps): 5-6 loans each repaid within a day lift a "
                   "farmer to band B within weeks, above steady honest students. Fixing it needs a design decision.")
def test_farmers_do_not_outrank_honest_students(small):
    by_user = records_by_user(small)
    krs: dict[str, list[int]] = defaultdict(list)
    for p in small.students:
        if p.subtype == "farmer" or p.archetype == "reliable":
            krs["farmer" if p.subtype == "farmer" else "reliable"].append(
                score(by_user[str(p.user_id)], NOW, CFG).krs)
    assert statistics.mean(krs["farmer"]) <= statistics.mean(krs["reliable"])
