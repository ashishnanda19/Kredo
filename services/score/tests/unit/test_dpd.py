from datetime import UTC, date, datetime

import pytest

from app.domain.dpd import days_past_due, dpd_bucket, ist_date


def test_ist_date_rolls_over_at_1830_utc():
    assert ist_date(datetime(2026, 11, 1, 18, 29, tzinfo=UTC)) == date(2026, 11, 1)
    assert ist_date(datetime(2026, 11, 1, 18, 30, tzinfo=UTC)) == date(2026, 11, 2)


def test_ist_date_rejects_naive_times():
    with pytest.raises(ValueError):
        ist_date(datetime(2026, 11, 1, 12, 0))  # noqa: DTZ001


def test_no_dpd_on_or_before_the_due_date():
    assert days_past_due(date(2026, 11, 10), date(2026, 11, 1)) == 0
    assert days_past_due(date(2026, 11, 10), date(2026, 11, 10)) == 0


def test_dpd_counts_days_after_the_due_date():
    assert days_past_due(date(2026, 11, 10), date(2026, 11, 11)) == 1
    assert days_past_due(date(2026, 11, 10), date(2026, 12, 15)) == 35


def test_dpd_stops_when_cleared():
    assert days_past_due(date(2026, 11, 10), date(2026, 12, 15), cleared_on=date(2026, 11, 14)) == 4


@pytest.mark.parametrize(("dpd", "bucket"), [
    (0, "0"), (1, "1-7"), (7, "1-7"), (8, "8-30"), (30, "8-30"), (31, "31-60"), (60, "31-60"), (61, "61-90"),
    (90, "61-90"), (91, "90+"), (400, "90+"),
])
def test_dpd_buckets(dpd, bucket):
    assert dpd_bucket(dpd) == bucket
