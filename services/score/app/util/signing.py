"""HMAC request signing for service-to-service calls.

signature = hex(HMAC-SHA256(secret, f"{timestamp}\\n{METHOD}\\n{path_and_query}\\n{sha256_hex(body)}"))
sent as X-Kredo-Key-Id, X-Kredo-Timestamp (Unix seconds) and X-Kredo-Signature.
"""

import hashlib
import hmac

KEY_HEADER = "x-kredo-key-id"
TS_HEADER = "x-kredo-timestamp"
SIG_HEADER = "x-kredo-signature"


def signature(secret: str, timestamp: int, method: str, path: str, body: bytes) -> str:
    message = f"{timestamp}\n{method.upper()}\n{path}\n{hashlib.sha256(body).hexdigest()}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def signed_headers(key_id: str, secret: str, timestamp: int, method: str, path: str, body: bytes) -> dict[str, str]:
    return {
        KEY_HEADER: key_id,
        TS_HEADER: str(timestamp),
        SIG_HEADER: signature(secret, timestamp, method, path, body),
        "content-type": "application/json",
    }


def verify(secret: str, timestamp: int, method: str, path: str, body: bytes, given: str) -> bool:
    return hmac.compare_digest(signature(secret, timestamp, method, path, body), given)
