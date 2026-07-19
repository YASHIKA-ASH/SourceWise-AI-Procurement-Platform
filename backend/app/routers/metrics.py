from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.performance_log import PerformanceLog

router = APIRouter(tags=["Metrics"])


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):

    total_requests = db.query(PerformanceLog).count()

    avg_latency = (
        db.query(func.avg(PerformanceLog.latency_ms)).scalar() or 0
    )

    max_latency = (
        db.query(func.max(PerformanceLog.latency_ms)).scalar() or 0
    )

    min_latency = (
        db.query(func.min(PerformanceLog.latency_ms)).scalar() or 0
    )

    return {
        "total_requests": total_requests,
        "average_latency": round(avg_latency, 2),
        "maximum_latency": round(max_latency, 2),
        "minimum_latency": round(min_latency, 2)
    }