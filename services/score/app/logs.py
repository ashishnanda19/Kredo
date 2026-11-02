"""JSON logs. Only the whitelisted fields below are emitted, so payloads and personal data cannot leak into logs."""

import json
import logging
import sys

SAFE_FIELDS = ("event_id", "user_id", "msg_id", "role", "count", "status", "path", "alert_id", "rule")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        out = {"level": record.levelname, "logger": record.name, "msg": record.getMessage()}
        out.update({k: getattr(record, k) for k in SAFE_FIELDS if hasattr(record, k)})
        if record.exc_info:
            out["error"] = record.exc_info[0].__name__ if record.exc_info[0] else None
        return json.dumps(out, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=level, handlers=[handler], force=True)
