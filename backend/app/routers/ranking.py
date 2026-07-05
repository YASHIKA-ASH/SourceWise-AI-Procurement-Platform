from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.supplier import Supplier

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.get("/")
def ranking(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    ranked = sorted(
        suppliers,
        key=lambda s: (
            s.quality_score +
            s.on_time_delivery +
            s.sustainability_score -
            s.defect_rate * 10
        ),
        reverse=True
    )

    return [
        {
            "rank": i + 1,
            "supplier": s.name,
            "score": round(
                s.quality_score +
                s.on_time_delivery +
                s.sustainability_score -
                s.defect_rate * 10,
                2
            )
        }
        for i, s in enumerate(ranked)
    ]