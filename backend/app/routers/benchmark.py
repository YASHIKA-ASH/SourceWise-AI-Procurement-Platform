import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..benchmark_schemas import SimulationBenchmarkRequest
from ..cache import cache
from ..database import get_db
from ..models import BOMComponent, EnterpriseSettings, Product, SupplierOffer
from ..services.simulation_benchmark import run_simulation_benchmark

router = APIRouter(tags=["Procurement Benchmark"])

BASELINE_STRATEGIES = {
    "manual_baseline",
    "lowest_cost",
    "lowest_risk",
    "fastest_delivery",
    "balanced",
}
OPTIMIZED_STRATEGIES = {"balanced", "lowest_cost", "lowest_risk", "fastest_delivery"}


@router.post("/analysis/products/{product_id}/benchmark")
def simulation_benchmark(
    product_id: int,
    payload: SimulationBenchmarkRequest,
    db: Session = Depends(get_db),
):
    if payload.baseline_strategy not in BASELINE_STRATEGIES:
        raise HTTPException(
            status_code=400,
            detail=f"Baseline strategy must be one of {sorted(BASELINE_STRATEGIES)}",
        )
    if payload.optimized_strategy not in OPTIMIZED_STRATEGIES:
        raise HTTPException(
            status_code=400,
            detail=f"Optimized strategy must be one of {sorted(OPTIMIZED_STRATEGIES)}",
        )

    product = db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.components)
            .selectinload(BOMComponent.offers)
            .selectinload(SupplierOffer.supplier)
        )
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.components:
        raise HTTPException(status_code=422, detail="Add BOM components before running a benchmark")
    if not any(component.offers for component in product.components):
        raise HTTPException(status_code=422, detail="Add supplier offers before running a benchmark")

    enterprise_settings = db.scalar(select(EnterpriseSettings).limit(1))
    if not enterprise_settings:
        enterprise_settings = EnterpriseSettings()
        db.add(enterprise_settings)
        db.commit()
        db.refresh(enterprise_settings)

    digest = hashlib.sha256(payload.model_dump_json().encode("utf-8")).hexdigest()[:20]
    cache_key = f"sourcewise:data:benchmark:{product_id}:{digest}"
    cached = cache.get_json(cache_key)
    if cached is not None:
        cached["cache"] = {"hit": True, "provider": "redis"}
        return cached

    result = run_simulation_benchmark(product, enterprise_settings, payload)
    result["cache"] = {"hit": False, "provider": "simulation"}
    cache.set_json(cache_key, result, ttl=900)
    return result
