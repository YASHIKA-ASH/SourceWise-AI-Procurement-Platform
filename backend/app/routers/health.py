from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from ..cache import cache
from ..config import settings
from ..database import engine
from ..services.s3_storage import s3_storage

router = APIRouter(tags=["Health"])


@router.get("/health")
def liveness():
    return {"status": "healthy", "environment": settings.environment}


@router.get("/health/ready")
def readiness():
    checks = {
        "database": _database_ready(),
        "redis": cache.ping() if settings.redis_url else None,
        "s3": s3_storage.health() if settings.s3_enabled else None,
    }
    required_checks = [checks["database"]]
    if settings.redis_url:
        required_checks.append(bool(checks["redis"]))
    if settings.s3_enabled:
        required_checks.append(bool(checks["s3"]))

    status = "ready" if all(required_checks) else "degraded"
    payload = {"status": status, "checks": checks}
    if status != "ready":
        raise HTTPException(status_code=503, detail=payload)
    return payload


def _database_ready() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
