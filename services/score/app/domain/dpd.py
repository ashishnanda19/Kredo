"""Days-past-due maths. Due dates are calendar dates in India time, so every timestamp is converted to IST first."""

from datetime import date, datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30), "IST")

DPD_BUCKETS: tuple[tuple[int, int | None, str], ...] = (
    (0, 0, "0"),
    (1, 7, "1-7"),
    (8, 30, "8-30"),
    (31, 60, "31-60"),
    (61, 90, "61-90"),
    (91, None, "90+"),
)


def ist_date(ts: datetime) -> date:
    if ts.tzinfo is None:
        raise ValueError("timestamps must be timezone-aware")
    return ts.astimezone(IST).date()


def days_past_due(due_date: date, as_of: date, cleared_on: date | None = None) -> int:
    """Days since the due date while anything is unpaid. Stops counting on the day the loan was cleared or closed."""
    end = as_of if cleared_on is None else min(cleared_on, as_of)
    return max(0, (end - due_date).days)


def dpd_bucket(dpd: int) -> str:
    if dpd < 0:
        raise ValueError("dpd cannot be negative")
    for low, high, label in DPD_BUCKETS:
        if dpd >= low and (high is None or dpd <= high):
            return label
    raise AssertionError("unreachable")
