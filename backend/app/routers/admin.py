from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..cache import cache
from ..config import settings
from ..database import get_db
from ..dependencies import require_roles
from ..models_enterprise import AuditEvent
from ..services.s3_storage import s3_storage

router = APIRouter(
    prefix="/admin",
    tags=["Enterprise Administration"],
    dependencies=[Depends(require_roles("admin"))],
)


@router.get("/audit-events")
def audit_events(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)).all()
    return [
        {
            "id": row.id,
            "actor_user_id": row.actor_user_id,
            "request_id": row.request_id,
            "action": row.action,
            "resource_type": row.resource_type,
            "resource_id": row.resource_id,
            "ip_address": row.ip_address,
            "details": row.details,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@router.get("/infrastructure")
def infrastructure_status():
    return {
        "environment": settings.environment,
        "database_backend": settings.database_url.split(":", 1)[0],
        "redis_configured": bool(settings.redis_url),
        "redis_available": cache.ping() if settings.redis_url else None,
        "s3_configured": settings.s3_enabled,
        "s3_available": s3_storage.health() if settings.s3_enabled else None,
        "aws_region": settings.aws_region,
        "log_file": settings.log_file,
    }
