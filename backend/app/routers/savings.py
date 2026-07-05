from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.supplier import Supplier

router = APIRouter(prefix="/savings", tags=["Savings"])

@router.get("/")
def savings(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    cheapest = min(s.price_per_unit for s in suppliers)

    return {
        "best_price": cheapest,
        "annual_saving": cheapest * 50000
    }