from copy import copy

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..cache import cache
from ..database import get_db
from ..models import BOMComponent, EnterpriseSettings, Product, SupplierOffer
from ..schemas import ScenarioRequest, SettingsUpdate
from ..services.procurement import product_recommendation

router = APIRouter(tags=["Procurement Analysis"])
VALID_STRATEGIES = {"balanced", "lowest_cost", "lowest_risk", "fastest_delivery"}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    return _settings(db)


@router.put("/settings")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    settings = _settings(db)
    for key, value in payload.model_dump().items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/analysis/products/{product_id}/recommendation")
def recommendation(
    product_id: int,
    strategy: str = Query(default="balanced"),
    db: Session = Depends(get_db),
):
    if strategy not in VALID_STRATEGIES:
        raise HTTPException(status_code=400, detail=f"Strategy must be one of {sorted(VALID_STRATEGIES)}")
    key = f"sourcewise:data:recommendation:{product_id}:{strategy}"
    cached = cache.get_json(key)
    if cached is not None:
        cached["cache"] = {"hit": True, "provider": "redis"}
        return cached

    product = _product_with_offers(product_id, db)
    result = product_recommendation(product, _settings(db), strategy=strategy)
    result["cache"] = {"hit": False, "provider": "database"}
    cache.set_json(key, result)
    return result


@router.post("/analysis/products/{product_id}/scenario")
def scenario(product_id: int, payload: ScenarioRequest, db: Session = Depends(get_db)):
    if payload.strategy not in VALID_STRATEGIES:
        raise HTTPException(status_code=400, detail=f"Strategy must be one of {sorted(VALID_STRATEGIES)}")
    product = _product_with_offers(product_id, db)
    baseline_settings = _settings(db)
    scenario_settings = copy(baseline_settings)

    overrides = [payload.cost_weight, payload.quality_weight, payload.lead_time_weight, payload.risk_weight]
    if any(value is not None for value in overrides):
        weights = {
            "cost_weight": payload.cost_weight if payload.cost_weight is not None else baseline_settings.cost_weight,
            "quality_weight": payload.quality_weight if payload.quality_weight is not None else baseline_settings.quality_weight,
            "lead_time_weight": payload.lead_time_weight if payload.lead_time_weight is not None else baseline_settings.lead_time_weight,
            "risk_weight": payload.risk_weight if payload.risk_weight is not None else baseline_settings.risk_weight,
        }
        if abs(sum(weights.values()) - 1.0) > 0.0001:
            raise HTTPException(status_code=422, detail="Scenario weights must total 1.0")
        for key, value in weights.items():
            setattr(scenario_settings, key, value)

    baseline = product_recommendation(product, baseline_settings, strategy="balanced")
    simulated = product_recommendation(
        product,
        scenario_settings,
        strategy=payload.strategy,
        demand_change_percentage=payload.demand_change_percentage,
        price_change_percentage=payload.supplier_price_change_percentage,
        transport_change_percentage=payload.transportation_cost_change_percentage,
        lead_time_delay_days=payload.lead_time_delay_days,
        unavailable_supplier_ids=set(payload.unavailable_supplier_ids),
        domestic_only=payload.domestic_suppliers_only,
    )

    keys = [
        "final_product_procurement_cost",
        "average_quality_score",
        "average_risk_exposure",
        "supplier_dependency_percentage",
        "expected_profit_margin",
    ]
    differences = {}
    for key in keys:
        before = baseline["summary"].get(key)
        after = simulated["summary"].get(key)
        differences[key] = round(after - before, 2) if before is not None and after is not None else None

    return {"baseline": baseline, "scenario": simulated, "difference": differences}


@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    key = "sourcewise:data:dashboard:summary"
    cached = cache.get_json(key)
    if cached is not None:
        cached["cache"] = {"hit": True, "provider": "redis"}
        return cached

    products = db.scalars(select(Product)).all()
    product_cards = []
    total_cost = 0.0
    at_risk_components = 0

    for product in products:
        loaded = _product_with_offers(product.id, db)
        result = product_recommendation(loaded, _settings(db), strategy="balanced")
        total_cost += result["summary"]["final_product_procurement_cost"]
        at_risk_components += sum(1 for item in result["component_results"] if item["status"] == "constraint_failure")
        product_cards.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "procurement_cost": result["summary"]["final_product_procurement_cost"],
                "target_status": result["summary"]["target_status"],
                "bottleneck": result["summary"]["production_bottleneck"],
            }
        )

    from ..models import Supplier

    supplier_rows = db.scalars(select(Supplier)).all()
    result = {
        "total_procurement_spending": round(total_cost, 2),
        "average_supplier_lead_time": round(sum(s.average_lead_time_days for s in supplier_rows) / len(supplier_rows), 2) if supplier_rows else 0,
        "on_time_delivery_rate": round(sum(s.on_time_delivery_percentage for s in supplier_rows) / len(supplier_rows), 2) if supplier_rows else 0,
        "high_risk_suppliers": sum(1 for s in supplier_rows if s.risk_score >= 60),
        "components_at_risk": at_risk_components,
        "purchase_orders_awaiting_approval": 0,
        "forecasted_procurement_cost": round(total_cost, 2),
        "products": product_cards,
        "cache": {"hit": False, "provider": "database"},
    }
    cache.set_json(key, result)
    return result


def _settings(db: Session) -> EnterpriseSettings:
    settings = db.scalar(select(EnterpriseSettings).limit(1))
    if not settings:
        settings = EnterpriseSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _product_with_offers(product_id: int, db: Session) -> Product:
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
    return product
