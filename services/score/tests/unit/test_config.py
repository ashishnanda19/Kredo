import copy
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from app.config.loader import DEFAULT_POLICY, DEFAULT_SCORECARD, build_config, load_config

SC = yaml.safe_load(Path(DEFAULT_SCORECARD).read_text())
POL = yaml.safe_load(Path(DEFAULT_POLICY).read_text())


def variant(scorecard=None, policy=None):
    return build_config(scorecard or copy.deepcopy(SC), policy or copy.deepcopy(POL))


def test_shipped_config_loads_with_a_stable_hash():
    a, b = load_config(), variant()
    assert a.hash == b.hash and len(a.hash) == 64


def test_hash_ignores_formatting_but_tracks_values():
    sc = copy.deepcopy(SC)
    sc["factors"]["f6_stacking"]["bins"][1]["points"] = -16
    assert variant(sc).hash != load_config().hash


def test_bins_must_end_with_else():
    sc = copy.deepcopy(SC)
    sc["factors"]["f6_stacking"]["bins"].pop()
    with pytest.raises(ValidationError, match="else"):
        variant(sc)


def test_bins_must_be_ascending():
    sc = copy.deepcopy(SC)
    bins = sc["factors"]["f3_current_overdue"]["bins"]
    bins[1], bins[2] = bins[2], bins[1]
    with pytest.raises(ValidationError, match="ascending"):
        variant(sc)


@pytest.mark.parametrize(("factor", "index", "points"), [
    ("f1_ontime_rate", 0, 100),       # a worse on-time rate earning more than a better one
    ("f2_worst_lateness", 3, 50),     # more lateness earning points
    ("f4_payment_failures", 2, 20),   # more failures earning points
    ("f7_utilisation", 2, 30),        # higher utilisation earning more
    ("f9_track_record", 4, 0),        # a longer record earning less
])
def test_non_monotone_points_are_refused(factor, index, points):
    sc = copy.deepcopy(SC)
    sc["factors"][factor]["bins"][index]["points"] = points
    with pytest.raises(ValidationError, match="points must not"):
        variant(sc)


def test_bureau_points_stay_in_range():
    sc = copy.deepcopy(SC)
    sc["factors"]["f12_bureau"]["bands"]["A"] = 80
    with pytest.raises(ValidationError, match="-60..\\+40"):
        variant(sc)


def test_bands_must_fall_from_a_to_e():
    pol = copy.deepcopy(POL)
    pol["bands"][0]["min_krs"], pol["bands"][1]["min_krs"] = 600, 680
    with pytest.raises(ValidationError, match="band minimums"):
        variant(policy=pol)


def test_unknown_keys_are_refused():
    pol = copy.deepcopy(POL)
    pol["repayment"]["grace_dayz"] = 2
    with pytest.raises(ValidationError):
        variant(policy=pol)
