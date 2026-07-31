from __future__ import annotations

from copy import copy
from datetime import date, timedelta
from typing import Any

from ..models import BOMComponent, EnterpriseSettings, SupplierOffer


def net_requirement(component: BOMComponent, demand_change_percentage: float = 0) -> float:
    adjusted_required = component.required_quantity * (1 + demand_change_percentage / 100)
    usable_inventory = max(component.current_inventory - component.reserved_inventory, 0)
    return max(adjusted_required + component.safety_stock - usable_inventory, 0)


def landed_cost_breakdown(
    offer: SupplierOffer,
    quantity: float,
    price_change_percentage: float = 0,
    transport_change_percentage: float = 0,
) -> dict[str, float]:
    adjusted_unit_price = offer.unit_price * (1 + price_change_percentage / 100)
    adjusted_transport = offer.transportation_cost_per_unit * (1 + transport_change_percentage / 100)

    material = adjusted_unit_price * quantity
    transportation = adjusted_transport * quantity
    customs = material * offer.customs_import_duty_percentage / 100
    packaging = offer.packaging_cost_per_unit * quantity
    warehousing = offer.warehousing_cost_per_unit * quantity
    pre_tax = material + transportation + customs + packaging + warehousing
    taxes = pre_tax * offer.tax_percentage / 100
    delay = offer.delay_related_cost_per_unit * quantity
    total = pre_tax + taxes + delay

    return {
        "material_cost": round(material, 2),
        "transportation_cost": round(transportation, 2),
        "customs_import_duty": round(customs, 2),
        "packaging_cost": round(packaging, 2),
        "warehousing_cost": round(warehousing, 2),
        "taxes": round(taxes, 2),
        "delay_related_cost": round(delay, 2),
        "total_landed_cost": round(total, 2),
        "landed_cost_per_unit": round(total / quantity, 4) if quantity else 0,
    }


def eligibility(offer: SupplierOffer, settings: EnterpriseSettings, domestic_only: bool = False) -> tuple[bool, list[str]]:
    supplier = offer.supplier
    reasons: list[str] = []

    if settings.approved_suppliers_only and not supplier.is_approved:
        reasons.append("Supplier is not approved")
    if settings.require_iso_certification and not supplier.iso_certified:
        reasons.append("Required ISO certification is missing")
    if settings.minimum_quality_rating is not None and supplier.quality_rating < settings.minimum_quality_rating:
        reasons.append("Quality rating is below the configured threshold")
    if settings.maximum_risk_score is not None and supplier.risk_score > settings.maximum_risk_score:
        reasons.append("Risk score exceeds the configured limit")
    if settings.maximum_lead_time_days is not None and offer.lead_time_days > settings.maximum_lead_time_days:
        reasons.append("Lead time exceeds the configured limit")
    if domestic_only and not supplier.is_domestic:
        reasons.append("Only domestic suppliers are allowed in this scenario")
    if supplier.available_capacity <= 0:
        reasons.append("No available production capacity")

    return not reasons, reasons


def score_offers(
    offers: list[SupplierOffer],
    settings: EnterpriseSettings,
    quantity: float,
    price_change_percentage: float = 0,
    transport_change_percentage: float = 0,
    lead_time_delay_days: int = 0,
) -> list[dict[str, Any]]:
    if not offers:
        return []

    landed = {
        offer.id: landed_cost_breakdown(
            offer,
            max(quantity, 1),
            price_change_percentage,
            transport_change_percentage,
        )["landed_cost_per_unit"]
        for offer in offers
    }
    minimum_cost = min(landed.values()) or 1
    minimum_lead = min(max(offer.lead_time_days + lead_time_delay_days, 1) for offer in offers)

    results = []
    for offer in offers:
        supplier = offer.supplier
        adjusted_lead = offer.lead_time_days + lead_time_delay_days
        cost_score = min(100, (minimum_cost / landed[offer.id]) * 100) if landed[offer.id] else 100
        quality_score = supplier.quality_rating
        lead_time_score = min(100, (minimum_lead / max(adjusted_lead, 1)) * 100)
        risk_desirability_score = 100 - supplier.risk_score
        overall = (
            cost_score * settings.cost_weight
            + quality_score * settings.quality_weight
            + lead_time_score * settings.lead_time_weight
            + risk_desirability_score * settings.risk_weight
        )
        results.append(
            {
                "offer": offer,
                "cost_score": round(cost_score, 2),
                "quality_score": round(quality_score, 2),
                "lead_time_score": round(lead_time_score, 2),
                "risk_score": round(risk_desirability_score, 2),
                "risk_exposure": round(supplier.risk_score, 2),
                "overall_score": round(overall, 2),
                "landed_cost_per_unit": landed[offer.id],
                "adjusted_lead_time_days": adjusted_lead,
            }
        )
    return results


def _sort_scored(scored: list[dict[str, Any]], strategy: str) -> list[dict[str, Any]]:
    if strategy == "manual_baseline":
        # Deterministic first-feasible allocation approximates a manual process
        # that accepts supplier offers in the order they were recorded.
        return sorted(scored, key=lambda x: x["offer"].id)
    if strategy == "lowest_cost":
        return sorted(scored, key=lambda x: (x["landed_cost_per_unit"], -x["overall_score"]))
    if strategy == "lowest_risk":
        return sorted(scored, key=lambda x: (x["risk_exposure"], x["landed_cost_per_unit"]))
    if strategy == "fastest_delivery":
        return sorted(scored, key=lambda x: (x["adjusted_lead_time_days"], x["landed_cost_per_unit"]))
    return sorted(scored, key=lambda x: (-x["overall_score"], x["landed_cost_per_unit"]))


def allocate_component(
    component: BOMComponent,
    settings: EnterpriseSettings,
    strategy: str = "balanced",
    demand_change_percentage: float = 0,
    price_change_percentage: float = 0,
    transport_change_percentage: float = 0,
    lead_time_delay_days: int = 0,
    unavailable_supplier_ids: set[int] | None = None,
    domestic_only: bool = False,
    capacity_remaining: dict[int, float] | None = None,
) -> dict[str, Any]:
    unavailable_supplier_ids = unavailable_supplier_ids or set()
    required = net_requirement(component, demand_change_percentage)
    if required <= 0:
        return {
            "component_id": component.id,
            "part_name": component.part_name,
            "gross_required_quantity": component.required_quantity,
            "net_purchase_requirement": 0,
            "status": "inventory_sufficient",
            "allocations": [],
            "rejected_suppliers": [],
            "shortfall": 0,
        }

    eligible_offers = []
    rejected = []
    for offer in component.offers:
        if offer.supplier_id in unavailable_supplier_ids:
            rejected.append({"supplier": offer.supplier.name, "reasons": ["Supplier is unavailable in this scenario"]})
            continue
        is_eligible, reasons = eligibility(offer, settings, domestic_only)
        if is_eligible:
            eligible_offers.append(offer)
        else:
            rejected.append({"supplier": offer.supplier.name, "reasons": reasons})

    scored = score_offers(
        eligible_offers,
        settings,
        required,
        price_change_percentage,
        transport_change_percentage,
        lead_time_delay_days,
    )
    ranked = _sort_scored(scored, strategy)

    remaining = required
    allocations = []
    max_share_quantity = required * settings.maximum_supplier_share_percentage / 100

    for rank, item in enumerate(ranked, start=1):
        offer = item["offer"]
        supplier = offer.supplier
        supplier_cap = (
            capacity_remaining.get(supplier.id, supplier.available_capacity)
            if capacity_remaining is not None
            else supplier.available_capacity
        )
        if supplier.maximum_order_size > 0:
            supplier_cap = min(supplier_cap, supplier.maximum_order_size)
        supplier_cap = min(supplier_cap, max_share_quantity)
        allocate = min(remaining, supplier_cap)

        minimum_order = max(offer.minimum_order_quantity, component.default_minimum_order_quantity)
        if settings.enforce_minimum_order_quantity and allocate < minimum_order:
            rejected.append(
                {
                    "supplier": supplier.name,
                    "reasons": [f"Feasible allocation {allocate:.2f} is below MOQ {minimum_order:.2f}"],
                }
            )
            continue
        if allocate <= 0:
            continue

        breakdown = landed_cost_breakdown(
            offer,
            allocate,
            price_change_percentage,
            transport_change_percentage,
        )
        expected_arrival = date.today() + timedelta(days=item["adjusted_lead_time_days"])
        allocations.append(
            {
                "rank": rank,
                "supplier_id": supplier.id,
                "supplier_name": supplier.name,
                "country": supplier.country,
                "is_domestic": supplier.is_domestic,
                "allocated_quantity": round(allocate, 2),
                "available_capacity": round(supplier.available_capacity, 2),
                "overall_score": item["overall_score"],
                "score_breakdown": {
                    "cost": item["cost_score"],
                    "quality": item["quality_score"],
                    "lead_time": item["lead_time_score"],
                    "risk": item["risk_score"],
                },
                "risk_exposure": item["risk_exposure"],
                "lead_time_days": item["adjusted_lead_time_days"],
                "expected_arrival_date": expected_arrival.isoformat(),
                "required_delivery_date": component.required_delivery_date.isoformat(),
                "on_time": expected_arrival <= component.required_delivery_date,
                "cost_breakdown": breakdown,
                "selection_reason": _selection_reason(item, strategy),
            }
        )
        remaining -= allocate
        if capacity_remaining is not None:
            capacity_remaining[supplier.id] = max(capacity_remaining.get(supplier.id, supplier.available_capacity) - allocate, 0)
        if remaining <= 0.0001:
            break

    domestic_selected = any(a["is_domestic"] for a in allocations)
    domestic_requirement_failed = settings.require_domestic_supplier and not domestic_selected

    status = "fully_allocated" if remaining <= 0.0001 and not domestic_requirement_failed else "constraint_failure"
    return {
        "component_id": component.id,
        "part_name": component.part_name,
        "category": component.category,
        "gross_required_quantity": round(component.required_quantity * (1 + demand_change_percentage / 100), 2),
        "current_inventory": component.current_inventory,
        "reserved_inventory": component.reserved_inventory,
        "safety_stock": component.safety_stock,
        "net_purchase_requirement": round(required, 2),
        "status": status,
        "allocations": allocations,
        "rejected_suppliers": rejected,
        "shortfall": round(max(remaining, 0), 2),
        "domestic_requirement_failed": domestic_requirement_failed,
    }


def _selection_reason(item: dict[str, Any], strategy: str) -> str:
    if strategy == "manual_baseline":
        return "Selected as the first feasible recorded supplier offer; used only as a benchmark baseline."
    if strategy == "lowest_cost":
        return "Selected for the lowest feasible landed cost while satisfying capacity and enterprise filters."
    if strategy == "lowest_risk":
        return "Selected for the lowest supplier risk among feasible offers."
    if strategy == "fastest_delivery":
        return "Selected for the shortest feasible lead time."
    return "Selected for the strongest weighted balance of cost, quality, lead time, and risk."


def _component_scarcity_key(
    component: BOMComponent,
    settings: EnterpriseSettings,
    *,
    demand_change_percentage: float = 0,
    unavailable_supplier_ids: set[int] | None = None,
    domestic_only: bool = False,
) -> tuple[Any, ...]:
    """Place difficult-to-source components before well-covered components.

    The original implementation processed critical components first. That can
    consume shared supplier capacity before a scarce component is evaluated.
    This key estimates eligible capacity coverage so the allocation engine
    reserves capacity for components with fewer feasible alternatives.
    """

    unavailable_supplier_ids = unavailable_supplier_ids or set()
    required = net_requirement(component, demand_change_percentage)
    if required <= 0:
        return (1, float("inf"), float("inf"), not component.is_critical, component.required_delivery_date)

    eligible_count = 0
    effective_capacity = 0.0
    max_share_quantity = required * settings.maximum_supplier_share_percentage / 100

    for offer in component.offers:
        if offer.supplier_id in unavailable_supplier_ids:
            continue
        is_eligible, _ = eligibility(offer, settings, domestic_only)
        if not is_eligible:
            continue

        supplier = offer.supplier
        capacity = max(float(supplier.available_capacity), 0.0)
        if supplier.maximum_order_size > 0:
            capacity = min(capacity, float(supplier.maximum_order_size))
        capacity = min(capacity, max_share_quantity)

        minimum_order = max(offer.minimum_order_quantity, component.default_minimum_order_quantity)
        if settings.enforce_minimum_order_quantity and min(required, capacity) < minimum_order:
            continue

        eligible_count += 1
        effective_capacity += capacity

    coverage_ratio = effective_capacity / required if required else float("inf")
    return (
        0,
        round(coverage_ratio, 8),
        eligible_count,
        not component.is_critical,
        component.required_delivery_date,
    )


def _build_product_recommendation(
    product,
    settings: EnterpriseSettings,
    *,
    strategy: str,
    **kwargs,
) -> dict[str, Any]:
    capacity_remaining: dict[int, float] = {}
    for component in product.components:
        for offer in component.offers:
            capacity_remaining.setdefault(offer.supplier.id, offer.supplier.available_capacity)

    demand_change_percentage = float(kwargs.get("demand_change_percentage", 0) or 0)
    unavailable_supplier_ids = kwargs.get("unavailable_supplier_ids") or set()
    domestic_only = bool(kwargs.get("domestic_only", False))

    ordered_components = sorted(
        product.components,
        key=lambda component: _component_scarcity_key(
            component,
            settings,
            demand_change_percentage=demand_change_percentage,
            unavailable_supplier_ids=unavailable_supplier_ids,
            domestic_only=domestic_only,
        ),
    )

    component_results = [
        allocate_component(
            component,
            settings,
            strategy=strategy,
            capacity_remaining=capacity_remaining,
            **kwargs,
        )
        for component in ordered_components
    ]

    total_cost = 0.0
    latest_arrival: date | None = None
    bottleneck = None
    weighted_quality_numerator = 0.0
    weighted_risk_numerator = 0.0
    total_allocated = 0.0
    supplier_totals: dict[str, float] = {}

    for result in component_results:
        for allocation in result["allocations"]:
            total_cost += allocation["cost_breakdown"]["total_landed_cost"]
            arrival = date.fromisoformat(allocation["expected_arrival_date"])
            if latest_arrival is None or arrival > latest_arrival:
                latest_arrival = arrival
                bottleneck = result["part_name"]
            qty = allocation["allocated_quantity"]
            weighted_quality_numerator += allocation["score_breakdown"]["quality"] * qty
            weighted_risk_numerator += allocation["risk_exposure"] * qty
            total_allocated += qty
            supplier_totals[allocation["supplier_name"]] = supplier_totals.get(allocation["supplier_name"], 0) + qty

    expected_completion = latest_arrival + timedelta(days=product.production_days) if latest_arrival else None
    average_quality = weighted_quality_numerator / total_allocated if total_allocated else 0
    average_risk = weighted_risk_numerator / total_allocated if total_allocated else 0
    largest_supplier_quantity = max(supplier_totals.values(), default=0)
    dependency = largest_supplier_quantity / total_allocated * 100 if total_allocated else 0
    total_shortfall = sum(float(result.get("shortfall", 0) or 0) for result in component_results)

    allocations = [
        allocation
        for result in component_results
        for allocation in result.get("allocations", [])
    ]
    on_time_rate = (
        sum(1 for allocation in allocations if allocation.get("on_time")) / len(allocations) * 100
        if allocations
        else 0.0
    )

    selling_price = product.expected_selling_price
    profit = selling_price - total_cost if selling_price is not None else None
    margin = profit / selling_price * 100 if selling_price and selling_price != 0 else None

    target_status = "not_configured"
    target_variance = None
    acceptable_cost = None
    if product.target_manufacturing_cost is not None:
        acceptable_cost = product.target_manufacturing_cost
    elif selling_price is not None and product.minimum_profit_margin is not None:
        acceptable_cost = selling_price * (1 - product.minimum_profit_margin / 100)
    if product.maximum_procurement_budget is not None:
        acceptable_cost = min(acceptable_cost, product.maximum_procurement_budget) if acceptable_cost else product.maximum_procurement_budget
    if acceptable_cost is not None:
        target_variance = total_cost - acceptable_cost
        target_status = "within_target" if target_variance <= 0 else "target_exceeded"

    return {
        "product": {"id": product.id, "name": product.name, "sku": product.sku},
        "strategy": strategy,
        "component_results": component_results,
        "summary": {
            "final_product_procurement_cost": round(total_cost, 2),
            "expected_production_start_date": latest_arrival.isoformat() if latest_arrival else None,
            "expected_completion_date": expected_completion.isoformat() if expected_completion else None,
            "production_bottleneck": bottleneck,
            "average_quality_score": round(average_quality, 2),
            "average_risk_exposure": round(average_risk, 2),
            "supplier_dependency_percentage": round(dependency, 2),
            "on_time_allocation_rate": round(on_time_rate, 2),
            "total_shortfall": round(total_shortfall, 2),
            "expected_profit": round(profit, 2) if profit is not None else None,
            "expected_profit_margin": round(margin, 2) if margin is not None else None,
            "target_status": target_status,
            "maximum_acceptable_cost": round(acceptable_cost, 2) if acceptable_cost is not None else None,
            "target_cost_variance": round(target_variance, 2) if target_variance is not None else None,
            "all_components_fully_allocated": all(
                result["status"] in {"fully_allocated", "inventory_sufficient"}
                for result in component_results
            ),
        },
    }


def _is_guardrailed_candidate(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
) -> bool:
    """Return True only when a candidate does not trade away core outcomes."""

    baseline_summary = baseline["summary"]
    candidate_summary = candidate["summary"]
    tolerance = 1e-6

    if not baseline_summary["all_components_fully_allocated"]:
        return False
    if not candidate_summary["all_components_fully_allocated"]:
        return False

    return (
        candidate_summary["final_product_procurement_cost"]
        <= baseline_summary["final_product_procurement_cost"] + tolerance
        and candidate_summary["average_quality_score"] + tolerance
        >= baseline_summary["average_quality_score"]
        and candidate_summary["average_risk_exposure"]
        <= baseline_summary["average_risk_exposure"] + tolerance
        and candidate_summary["supplier_dependency_percentage"]
        <= baseline_summary["supplier_dependency_percentage"] + tolerance
        and candidate_summary["on_time_allocation_rate"] + tolerance
        >= baseline_summary["on_time_allocation_rate"]
    )


def _select_guardrailed_plan(
    baseline: dict[str, Any],
    candidates: list[dict[str, Any]],
) -> tuple[dict[str, Any], bool]:
    """Select a feasible, non-dominated plan and fall back safely when needed."""

    baseline_summary = baseline["summary"]

    if baseline_summary["all_components_fully_allocated"]:
        acceptable = [
            candidate
            for candidate in candidates
            if _is_guardrailed_candidate(baseline, candidate)
        ]
        if not acceptable:
            return baseline, True

        selected = min(
            acceptable,
            key=lambda plan: (
                plan["summary"]["final_product_procurement_cost"],
                plan["summary"]["average_risk_exposure"],
                -plan["summary"]["average_quality_score"],
                -plan["summary"]["on_time_allocation_rate"],
                plan["summary"]["supplier_dependency_percentage"],
            ),
        )
        return selected, False

    # When the baseline itself is infeasible, prefer complete allocation first,
    # then the least shortfall and strongest risk/quality/on-time outcome.
    selected = min(
        [baseline, *candidates],
        key=lambda plan: (
            not plan["summary"]["all_components_fully_allocated"],
            plan["summary"]["total_shortfall"],
            plan["summary"]["average_risk_exposure"],
            -plan["summary"]["average_quality_score"],
            -plan["summary"]["on_time_allocation_rate"],
            plan["summary"]["final_product_procurement_cost"],
        ),
    )
    return selected, selected is baseline


def product_recommendation(
    product,
    settings: EnterpriseSettings,
    **kwargs,
) -> dict[str, Any]:
    """Generate a recommendation, applying multi-objective guardrails to balanced mode.

    Balanced mode evaluates several feasible sourcing heuristics. It accepts an
    alternative only when it does not worsen cost, quality, risk, supplier
    dependency, on-time performance, or full allocation versus the documented
    manual baseline. Otherwise, it falls back to that baseline. This prevents a
    small cost saving from being reported as an improvement when reliability or
    supplier quality deteriorates.
    """

    parameters = dict(kwargs)
    requested_strategy = parameters.pop("strategy", "balanced")

    if requested_strategy != "balanced":
        return _build_product_recommendation(
            product,
            settings,
            strategy=requested_strategy,
            **parameters,
        )

    baseline = _build_product_recommendation(
        product,
        settings,
        strategy="manual_baseline",
        **parameters,
    )
    candidates = [
        _build_product_recommendation(
            product,
            settings,
            strategy=strategy,
            **parameters,
        )
        for strategy in ("balanced", "lowest_cost", "lowest_risk", "fastest_delivery")
    ]

    selected, fallback_used = _select_guardrailed_plan(baseline, candidates)
    selected_candidate_strategy = selected.get("strategy", "manual_baseline")
    selected["strategy"] = "balanced"
    selected["optimization_policy"] = "guardrailed_multi_objective"
    selected["selected_candidate_strategy"] = selected_candidate_strategy
    selected["guardrail_fallback_used"] = fallback_used
    return selected
