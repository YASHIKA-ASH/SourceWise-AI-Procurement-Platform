from typing import Dict, List

from pydantic import BaseModel


class CostMetrics(BaseModel):
    single_supplier_cost: float
    optimized_cost: float
    estimated_savings: float
    savings_percent: float


class OptimizationPlan(BaseModel):
    suppliers: List[str]
    quantity_split: Dict[str, int]
    total_cost: float
    average_price: float
    supplier_count: int


class CostOptimizationResponse(BaseModel):
    required_quantity: int
    metrics: CostMetrics
    best_plan: OptimizationPlan
    recommendations: List[OptimizationPlan]

    class Config:
        from_attributes = True