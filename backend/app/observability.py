from __future__ import annotations

import logging
import logging.handlers
import time
import uuid
from pathlib import Path

from fastapi import Request
from pythonjsonlogger.json import JsonFormatter
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .database import SessionLocal
from .models_enterprise import AuditEvent

logger = logging.getLogger("sourcewise.http")


def configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
    root.handlers.clear()

    formatter = JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(user_id)s %(method)s %(path)s %(status_code)s %(duration_ms)s"
    )

    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    root.addHandler(stream)

    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    file_handler = logging.handlers.RotatingFileHandler(
        log_path,
        maxBytes=20 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)


class RequestObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()
        response = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            logger.exception(
                "Unhandled request error",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                },
            )
            raise
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            user = getattr(request.state, "user", None)
            user_id = getattr(user, "id", None)
            logger.info(
                "HTTP request completed",
                extra={
                    "request_id": request_id,
                    "user_id": user_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                },
            )
            if response is not None:
                response.headers["X-Request-ID"] = request_id
            if request.method.upper() not in {"GET", "HEAD", "OPTIONS"}:
                _record_audit_event(request, request_id, user_id, status_code, duration_ms)


def _record_audit_event(
    request: Request,
    request_id: str,
    user_id: int | None,
    status_code: int,
    duration_ms: float,
) -> None:
    try:
        with SessionLocal() as db:
            db.add(
                AuditEvent(
                    actor_user_id=user_id,
                    request_id=request_id,
                    action=f"{request.method.upper()} {request.url.path}",
                    resource_type="http_request",
                    ip_address=request.client.host if request.client else None,
                    details={
                        "status_code": status_code,
                        "duration_ms": duration_ms,
                        "query": str(request.url.query),
                    },
                )
            )
            db.commit()
    except Exception as exc:  # Audit failure must never break the business request.
        logger.warning("Unable to persist audit event: %s", exc)
