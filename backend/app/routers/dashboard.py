from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.supplier import Supplier
from app.services.comparison import calculate_score

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()

    if not suppliers:
        return {
            "suppliers_count": 0,
            "avg_lead_time": 0,
            "lowest_cost": 0
        }

    return {
        "suppliers_count": len(suppliers),
        "avg_lead_time": round(
            sum(s.lead_time for s in suppliers) / len(suppliers),
            2
        ),
        "lowest_cost": round(
            min(s.price_per_unit for s in suppliers),
            2
        )
    }


@router.get("/risk-analysis")
def risk_analysis(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()

    high = 0
    medium = 0
    low = 0

    supplier_data = []

    for s in suppliers:

        risk = (
            s.defect_rate * 3 +
            (100 - s.on_time_delivery) * 0.5 +
            (100 - s.sustainability_score) * 0.1
        )

        if risk < 18:
            level = "Low"
            low += 1
        elif risk < 30:
            level = "Medium"
            medium += 1
        else:
            level = "High"
            high += 1

        supplier_data.append({
            "supplier": s.name,
            "risk_score": round(risk, 2),
            "risk_level": level,
            "overall_score": calculate_score(s)
        })

    return {
        "summary": {
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low
        },
        "suppliers": supplier_data
    }
