from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.cost_optimizer import CostOptimizationResponse
from app.services.cost_optimizer_service import get_cost_optimization

router = APIRouter(
    prefix="/cost-optimization",
    tags=["Cost Optimization"]
)


@router.get(
    "/",
    response_model=CostOptimizationResponse
)
def optimize_cost(
    quantity: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    return get_cost_optimization(
        db,
        quantity
    )