import os
import time
from uuid import UUID


def uuid7(now_ms: int | None = None) -> UUID:
    """RFC 9562 UUID version 7: 48-bit Unix milliseconds, then random bits. Sorts by creation time."""
    ms = int(time.time() * 1000) if now_ms is None else now_ms
    rand = int.from_bytes(os.urandom(10), "big")
    value = (ms & 0xFFFF_FFFF_FFFF) << 80
    value |= 0x7 << 76  # version
    value |= ((rand >> 62) & 0xFFF) << 64  # rand_a
    value |= 0b10 << 62  # variant
    value |= rand & 0x3FFF_FFFF_FFFF_FFFF  # rand_b
    return UUID(int=value)
