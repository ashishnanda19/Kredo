from collections import defaultdict

from app.scoring.scorecard import THIN_FILE, FactorScore


def reason_codes(factors: list[FactorScore], *, thin_file: bool, top: int = 3) -> list[dict]:
    """Top `top` positive and top `top` negative codes by absolute points, plus THIN_FILE (0 points) when it applies.
    Ties break on the code name so the order is deterministic.
    """
    totals: dict[str, int] = defaultdict(int)
    for f in factors:
        for code, points in f.codes.items():
            totals[code] += points
    ups = sorted(((c, p) for c, p in totals.items() if p > 0), key=lambda x: (-x[1], x[0]))[:top]
    downs = sorted(((c, p) for c, p in totals.items() if p < 0), key=lambda x: (x[1], x[0]))[:top]
    out = [{"code": c, "direction": "up", "points": p} for c, p in ups]
    out += [{"code": c, "direction": "down", "points": p} for c, p in downs]
    if thin_file:
        out.append({"code": THIN_FILE, "direction": "neutral", "points": 0})
    return out
