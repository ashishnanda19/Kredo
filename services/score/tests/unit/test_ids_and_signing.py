from app.util import signing
from app.util.ids import uuid7


def test_uuid7_has_version_7_and_rfc_variant():
    u = uuid7()
    assert u.version == 7
    assert u.variant == "specified in RFC 4122"


def test_uuid7_sorts_by_time():
    ids = [uuid7(now_ms=ms) for ms in (1_700_000_000_000, 1_700_000_000_001, 1_800_000_000_000)]
    assert ids == sorted(ids)


def test_signature_round_trip():
    sig = signing.signature("s" * 32, 1000, "post", "/v1/events", b"{}")
    assert signing.verify("s" * 32, 1000, "POST", "/v1/events", b"{}", sig)


def test_signature_binds_body_path_method_and_time():
    sig = signing.signature("s" * 32, 1000, "POST", "/v1/events", b"{}")
    assert not signing.verify("s" * 32, 1000, "POST", "/v1/events", b"{ }", sig)
    assert not signing.verify("s" * 32, 1000, "POST", "/v1/other", b"{}", sig)
    assert not signing.verify("s" * 32, 1000, "PUT", "/v1/events", b"{}", sig)
    assert not signing.verify("s" * 32, 1001, "POST", "/v1/events", b"{}", sig)
    assert not signing.verify("t" * 32, 1000, "POST", "/v1/events", b"{}", sig)
