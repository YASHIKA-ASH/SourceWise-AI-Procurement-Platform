from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.utils.risk_calculator import calculate_risk
from app.database.database import get_db
from app.models.supplier import Supplier
from app.models.performance_log import PerformanceLog
from app.dependencies import get_current_user
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
current_user=Depends(get_current_user)
@router.get("/overview")
def dashboard_overview(db: Session = Depends(get_db)):

    total_suppliers = db.query(Supplier).count()

    avg_price = db.query(func.avg(Supplier.price_per_unit)).scalar() or 0
    avg_quality = db.query(func.avg(Supplier.quality_score)).scalar() or 0
    avg_lead = db.query(func.avg(Supplier.lead_time)).scalar() or 0

    highest_rated = (
        db.query(Supplier)
        .order_by(Supplier.supplier_rating.desc())
        .first()
    )

    lowest_risk = (
        db.query(Supplier)
        .order_by(
            Supplier.defect_rate.asc(),
            Supplier.on_time_delivery.desc()
        )
        .first()
    )

    return {
        "total_suppliers": total_suppliers,
        "average_price_per_unit": round(avg_price, 2),
        "average_quality_score": round(avg_quality, 2),
        "average_lead_time": round(avg_lead, 2),
        "highest_rated_supplier": highest_rated.name if highest_rated else None,
        "lowest_risk_supplier": lowest_risk.name if lowest_risk else None
    }



@router.get("/top-suppliers")
def top_suppliers(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    result = []

    for s in suppliers:

        score = (
            (100 - s.price_per_unit * 2)
            + (100 - s.lead_time * 3)
            + (s.quality_score * 10)
            + (s.on_time_delivery * 10)
            + (s.supplier_rating * 10)
            + (s.sustainability_score * 5)
            - (s.defect_rate * 20)
        ) / 6

        result.append({
            "supplier": s.name,
            "score": round(score, 2),
            "price": s.price_per_unit,
            "quality": s.quality_score,
            "lead_time": s.lead_time
        })

    result.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return result



@router.get("/risk-analysis")
def risk_analysis(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    high = 0
    medium = 0
    low = 0

    supplier_risks = []

    for supplier in suppliers:

        risk = calculate_risk(supplier)

        if risk["risk_level"] == "High":
            high += 1
        elif risk["risk_level"] == "Medium":
            medium += 1
        else:
            low += 1

        supplier_risks.append({
            "supplier": supplier.name,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"]
        })

    supplier_risks.sort(
        key=lambda x: x["risk_score"],
        reverse=True
    )

    return {
        "summary": {
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low
        },
        "highest_risk_suppliers": supplier_risks[:5]
    }



@router.get("/spend-analysis")
def spend_analysis(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    if not suppliers:
        return {
            "estimated_monthly_spend": 0,
            "average_unit_cost": 0,
            "highest_cost_supplier": None,
            "lowest_cost_supplier": None
        }

    total_capacity = sum(
        s.capacity_per_month
        for s in suppliers
    )

    total_spend = sum(
        s.price_per_unit * s.capacity_per_month
        for s in suppliers
    )

    avg_cost = (
        total_spend / total_capacity
        if total_capacity else 0
    )

    highest = max(
        suppliers,
        key=lambda x: x.price_per_unit
    )

    lowest = min(
        suppliers,
        key=lambda x: x.price_per_unit
    )

    return {
        "estimated_monthly_spend": round(total_spend, 2),
        "average_unit_cost": round(avg_cost, 2),
        "highest_cost_supplier": highest.name,
        "lowest_cost_supplier": lowest.name
    }



@router.get("/performance")
def performance(db: Session = Depends(get_db)):

    logs = db.query(PerformanceLog).all()

    if not logs:
        return {
            "avg_api_latency_ms": 0,
            "avg_sql_time_ms": 0,
            "avg_retrieval_time_ms": 0,
            "avg_llm_time_ms": 0,
            "avg_embedding_time_ms": 0,
            "avg_tokens_used": 0,
            "cache_hit_rate": 0,
            "total_requests": 0
        }

    avg_api = sum(l.latency_ms for l in logs) / len(logs)

    avg_sql = sum(l.sql_time_ms for l in logs) / len(logs)

    avg_retrieval = sum(l.retrieval_ms for l in logs) / len(logs)

    avg_llm = sum(l.llm_ms for l in logs) / len(logs)

    avg_embedding = sum(l.embedding_time for l in logs) / len(logs)

    avg_tokens = sum(l.tokens_used for l in logs) / len(logs)

    cache_hits = len(
        [l for l in logs if l.cache_hit]
    )

    hit_rate = (cache_hits / len(logs)) * 100

    return {
        "avg_api_latency_ms": round(avg_api, 2),
        "avg_sql_time_ms": round(avg_sql, 2),
        "avg_retrieval_time_ms": round(avg_retrieval, 2),
        "avg_llm_time_ms": round(avg_llm, 2),
        "avg_embedding_time_ms": round(avg_embedding, 2),
        "avg_tokens_used": round(avg_tokens, 2),
        "cache_hit_rate": round(hit_rate, 2),
        "total_requests": len(logs)
    }