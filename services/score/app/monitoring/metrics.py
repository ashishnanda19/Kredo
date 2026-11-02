"""Model-health maths for the monitoring report and /v1/ops/monitoring. Pure: lists in, numbers out, no numpy.

- PSI: population stability of KRS between two months. Common reading: under 0.1 stable, 0.1 to 0.25 some shift,
  over 0.25 (the alert level in the policy) a real change in who the score is seeing.
- Calibration: the PD the scorecard predicted against the bad rate actually observed, per band.
- Gini and KS: how well the score separates good loans from bad ones, on labelled loans.
- Fairness: approval and band rates across cohorts that are NOT scored (for example year of study), for a person to
  review. It never changes a score.
"""

import math
from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

EPS = 1e-4  # an empty bin would make PSI infinite; this is the usual floor


def psi(expected: Sequence[float], actual: Sequence[float], *, bin_width: int = 50, top: int = 1000) -> float | None:
    """PSI of two samples of KRS, binned into `bin_width`-point bins over 0..top. None if either sample is empty."""
    if not expected or not actual:
        return None
    bins = top // bin_width + 1

    def shares(xs: Sequence[float]) -> list[float]:
        counts = Counter(min(int(x) // bin_width, bins - 1) for x in xs)
        return [max(counts.get(i, 0) / len(xs), EPS) for i in range(bins)]

    e, a = shares(expected), shares(actual)
    return round(sum((ai - ei) * math.log(ai / ei) for ei, ai in zip(e, a, strict=True)), 4)


def drift_series(by_month: Mapping[str, Sequence[float]], *, bin_width: int, alert_above: float,
                 min_users: int = 1) -> dict[str, Any]:
    """PSI between each month and the one before it, oldest first, and whether the latest breaches the alert level.
    A month with fewer than `min_users` students (or whose previous month has) gets no PSI: with so few students the
    number is noise, and an alert built on it would only teach people to ignore alerts."""
    months = sorted(by_month)
    points = []
    for prev, m in zip(months, months[1:], strict=False):
        enough = len(by_month[prev]) >= min_users and len(by_month[m]) >= min_users
        points.append({"month": m, "users": len(by_month[m]), "reliable": enough,
                       "psi": psi(by_month[prev], by_month[m], bin_width=bin_width) if enough else None})
    latest = points[-1]["psi"] if points else None
    return {"points": points, "alert_above": alert_above, "min_users": min_users, "latest_psi": latest,
            "alert": latest is not None and latest > alert_above}


def calibration(rows: Iterable[Mapping[str, Any]], *, min_loans: int) -> list[dict[str, Any]]:
    """Per band: labelled loans, mean predicted PD, observed bad rate. `reliable` only above `min_loans` loans."""
    by_band: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for r in rows:
        by_band[r["band"]].append(r)
    out = []
    for band in "ABCDE":
        rs = by_band.get(band, [])
        n = len(rs)
        bad = sum(bool(r["bad"]) for r in rs)
        out.append({
            "band": band, "loans": n, "bad": bad,
            "predicted_pd": round(sum(r["pd"] for r in rs) / n, 4) if n else None,
            "observed_bad_rate": round(bad / n, 4) if n else None,
            "reliable": n >= min_loans,
        })
    return out


def _ranks(xs: Sequence[float]) -> list[float]:
    """Average ranks (1-based), with ties sharing the mean rank."""
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    ranks = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return ranks


def discrimination(rows: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """AUC, Gini (2 AUC - 1) and KS of KRS against the bad label. A higher KRS should mean a good loan, so the score
    that ranks a loan as risky is its negation. None values when there are no good or no bad loans."""
    n_bad = sum(bool(r["bad"]) for r in rows)
    n_good = len(rows) - n_bad
    out: dict[str, Any] = {"loans": len(rows), "bad": n_bad, "auc": None, "gini": None, "ks": None}
    if not n_bad or not n_good:
        return out
    risk = [-r["krs"] for r in rows]
    ranks = _ranks(risk)
    bad_rank_sum = sum(rk for rk, r in zip(ranks, rows, strict=True) if r["bad"])
    auc = (bad_rank_sum - n_bad * (n_bad + 1) / 2) / (n_bad * n_good)  # P(a bad loan scores riskier than a good one)
    out["auc"], out["gini"] = round(auc, 4), round(2 * auc - 1, 4)

    ks = cum_bad = cum_good = 0.0
    for value in sorted({r["krs"] for r in rows}):  # walk from the lowest KRS up
        at = [r for r in rows if r["krs"] == value]
        cum_bad += sum(bool(r["bad"]) for r in at) / n_bad
        cum_good += sum(not r["bad"] for r in at) / n_good
        ks = max(ks, abs(cum_bad - cum_good))
    out["ks"] = round(ks, 4)
    return out


def fairness(rows: Sequence[Mapping[str, Any]], cohorts: Mapping[str, str], *, min_cell: int,
             flag_below: float) -> dict[str, Any]:
    """Rates by cohort for people to review. `rows`: user_id, band, aura, eligible. Cohorts under `min_cell` students
    are hidden (small cells can identify people). A cohort is flagged when its eligible rate is under `flag_below`
    times the best cohort's. The check is a prompt to look, never a decision."""
    groups: dict[str, list[Mapping[str, Any]]] = defaultdict(list)
    for r in rows:
        if r["user_id"] in cohorts:
            groups[cohorts[r["user_id"]]].append(r)
    cells, hidden = [], 0
    for name in sorted(groups):
        rs = groups[name]
        if len(rs) < min_cell:
            hidden += 1
            continue
        cells.append({
            "cohort": name, "students": len(rs),
            "eligible_rate": round(sum(bool(r["eligible"]) for r in rs) / len(rs), 4),
            "band_a_or_b_rate": round(sum(r["band"] in "AB" for r in rs) / len(rs), 4),
            "mean_aura": round(sum(r["aura"] for r in rs) / len(rs), 1),
        })
    best = max((c["eligible_rate"] for c in cells), default=0)
    for c in cells:
        c["ratio_to_best"] = round(c["eligible_rate"] / best, 3) if best else None
        c["flag"] = bool(best) and c["eligible_rate"] < flag_below * best
    return {"cohorts": cells, "hidden_small_cohorts": hidden, "flagged": [c["cohort"] for c in cells if c["flag"]],
            "note": "Cohorts are not scored. A flag means a person should look; nothing changes automatically."}
