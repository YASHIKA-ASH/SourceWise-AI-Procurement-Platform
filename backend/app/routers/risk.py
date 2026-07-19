from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.risk import SupplierRiskResponse
from app.services.risk_services import get_supplier_risk

router = APIRouter(
    prefix="/risk",
    tags=["Supplier Risk"]
)


@router.get(
    "/",
    response_model=List[SupplierRiskResponse]
)
def supplier_risk(db: Session = Depends(get_db)):
    return get_supplier_risk(db)