from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.supplier import Supplier

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/")
def analytics(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    if not suppliers:
        return {"message": "No suppliers"}

    return {
        "total_suppliers": len(suppliers),
        "average_quality": round(sum(s.quality_score for s in suppliers) / len(suppliers), 2),
        "average_lead_time": round(sum(s.lead_time for s in suppliers) / len(suppliers), 2),
        "highest_quality": max(s.quality_score for s in suppliers),
        "lowest_price": min(s.price_per_unit for s in suppliers)
    }