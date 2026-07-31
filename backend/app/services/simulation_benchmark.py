from __future__ import annotations

import math
import random
import time
from statistics import fmean
from typing import Any, Callable

from ..benchmark_schemas import SimulationBenchmarkRequest
from ..models import EnterpriseSettings, Product
from .procurement import product_recommendation

RecommendationFunction = Callable[..., dict[str, Any]]

STRATEGY_LABELS = {
    "manual_baseline": "First feasible supplier",
    "balanced": "Balanced SourceWise optimization",
    "lowest_cost": "Lowest landed cost",
    "lowest_risk": "Lowest supplier risk",
    "fastest_delivery": "Fastest delivery",
}

LOWER_IS_BETTER = {
    "procurement_cost": True,
    "risk_exposure": True,
    "supplier_dependency": True,
}


def _round(value: float | None, digits: int = 2) -> float | None:
    return round(value, digits) if value is not None and math.isfinite(value) else None


def _average(values: list[float | None]) -> float | None:
    clean = [float(value) for value in values if value is not None and math.isfinite(float(value))]
    return fmean(clean) if clean else None


def _percentile(values: list[float], percentile: float) -> float | None:
    clean = sorted(float(value) for value in values if math.isfinite(float(value)))
    if not clean:
        return None
    if len(clean) == 1:
        return clean[0]
    position = (len(clean) - 1) * percentile
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return clean[lower]
    weight = position - lower
    return clean[lower] * (1 - weight) + clean[upper] * weight


def _percentage_improvement(
    baseline: float | None,
    optimized: float | None,
    *,
    lower_is_better: bool,
) -> float | None:
    if baseline is None or optimized is None or abs(baseline) < 1e-12:
        return None
    delta = baseline - optimized if lower_is_better else optimized - baseline
    return delta / abs(baseline) * 100


def _metrics(result: dict[str, Any]) -> dict[str, float | bool | None]:
    summary = result["summary"]
    allocations = [
        allocation
        for component in result.get("component_results", [])
        for allocation in component.get("allocations", [])
    ]
    component_results = result.get("component_results", [])

    on_time_rate = (
        sum(1 for allocation in allocations if allocation.get("on_time")) / len(allocations) * 100
        if allocations
        else 0.0
    )
    feasible_components = sum(
        1
        for component in component_results
        if component.get("status") in {"fully_allocated", "inventory_sufficient"}
    )
    component_feasibility_rate = (
        feasible_components / len(component_results) * 100 if component_results else 100.0
    )

    return {
        "procurement_cost": summary.get("final_product_procurement_cost"),
        "quality_score": summary.get("average_quality_score"),
        "risk_exposure": summary.get("average_risk_exposure"),
        "supplier_dependency": summary.get("supplier_dependency_percentage"),
        "profit_margin": summary.get("expected_profit_margin"),
        "on_time_rate": on_time_rate,
        "component_feasibility_rate": component_feasibility_rate,
        "fully_allocated": bool(summary.get("all_components_fully_allocated")),
    }


def _rate(records: list[dict[str, Any]], key: str) -> float:
    if not records:
        return 0.0
    return sum(1 for record in records if record[key]) / len(records) * 100


def _metric_averages(records: list[dict[str, Any]]) -> dict[str, float | None]:
    keys = [
        "procurement_cost",
        "quality_score",
        "risk_exposure",
        "supplier_dependency",
        "profit_margin",
        "on_time_rate",
        "component_feasibility_rate",
    ]
    result = {key: _round(_average([record.get(key) for record in records])) for key in keys}
    result["full_allocation_rate"] = _round(_rate(records, "fully_allocated"))
    return result


def _win_rates(pairs: list[tuple[dict[str, Any], dict[str, Any]]]) -> dict[str, float | None]:
    definitions = {
        "cost": ("procurement_cost", True),
        "quality": ("quality_score", False),
        "risk": ("risk_exposure", True),
        "supplier_dependency": ("supplier_dependency", True),
        "on_time": ("on_time_rate", False),
    }
    output: dict[str, float | None] = {}
    for name, (key, lower_is_better) in definitions.items():
        comparable = [
            (baseline[key], optimized[key])
            for baseline, optimized in pairs
            if baseline.get(key) is not None and optimized.get(key) is not None
        ]
        if not comparable:
            output[name] = None
            continue
        wins = sum(
            1
            for baseline, optimized in comparable
            if (optimized < baseline if lower_is_better else optimized > baseline)
        )
        output[name] = _round(wins / len(comparable) * 100)
    return output


def _describe_change(value: float | None, improvement_word: str, regression_word: str) -> str:
    if value is None:
        return "insufficient comparable data"
    if value >= 0:
        return f"{abs(value):.1f}% {improvement_word}"
    return f"{abs(value):.1f}% {regression_word}"


def _headline(
    request: SimulationBenchmarkRequest,
    improvement: dict[str, float | None],
) -> str:
    cost = _describe_change(improvement["cost_reduction_percentage"], "lower cost", "higher cost")
    risk = _describe_change(improvement["risk_reduction_percentage"], "lower risk", "higher risk")
    allocation_points = improvement["full_allocation_rate_change_points"]
    allocation = (
        "insufficient allocation data"
        if allocation_points is None
        else f"{allocation_points:+.1f} percentage points in full-allocation success"
    )
    return (
        f"Across {request.scenario_count} simulated purchasing scenarios, "
        f"{STRATEGY_LABELS.get(request.optimized_strategy, request.optimized_strategy)} delivered "
        f"{cost}, {risk}, and {allocation} versus "
        f"{STRATEGY_LABELS.get(request.baseline_strategy, request.baseline_strategy)}."
    )


def run_simulation_benchmark(
    product: Product,
    settings: EnterpriseSettings,
    request: SimulationBenchmarkRequest,
    *,
    recommendation_fn: RecommendationFunction = product_recommendation,
) -> dict[str, Any]:
    """Run repeatable randomized scenarios and compare two sourcing strategies.

    The same shock is applied to both strategies in every scenario. Percentage
    metrics therefore compare strategy behavior, not two different random draws.
    Cost/quality/risk comparisons use scenarios where both strategies produced a
    fully allocated plan; feasibility rates use all scenarios.
    """

    started = time.perf_counter()
    rng = random.Random(request.seed)
    supplier_ids = sorted(
        {
            offer.supplier_id
            for component in product.components
            for offer in component.offers
        }
    )

    baseline_records: list[dict[str, Any]] = []
    optimized_records: list[dict[str, Any]] = []
    paired_feasible: list[tuple[dict[str, Any], dict[str, Any]]] = []

    disruption_probability = request.supplier_disruption_probability_percentage / 100

    for _ in range(request.scenario_count):
        demand_downside = min(10.0, request.demand_volatility_percentage * 0.35)
        price_downside = request.supplier_price_volatility_percentage * 0.35
        transport_downside = request.transportation_volatility_percentage * 0.25

        shocks = {
            "demand_change_percentage": rng.uniform(
                -demand_downside,
                request.demand_volatility_percentage,
            ),
            "price_change_percentage": rng.uniform(
                -price_downside,
                request.supplier_price_volatility_percentage,
            ),
            "transport_change_percentage": rng.uniform(
                -transport_downside,
                request.transportation_volatility_percentage,
            ),
            "lead_time_delay_days": rng.randint(0, request.maximum_lead_time_delay_days),
            "unavailable_supplier_ids": {
                supplier_id
                for supplier_id in supplier_ids
                if rng.random() < disruption_probability
            },
        }

        baseline = _metrics(
            recommendation_fn(
                product,
                settings,
                strategy=request.baseline_strategy,
                **shocks,
            )
        )
        optimized = _metrics(
            recommendation_fn(
                product,
                settings,
                strategy=request.optimized_strategy,
                **shocks,
            )
        )

        baseline_records.append(baseline)
        optimized_records.append(optimized)
        if baseline["fully_allocated"] and optimized["fully_allocated"]:
            paired_feasible.append((baseline, optimized))

    paired_baseline = [baseline for baseline, _ in paired_feasible]
    paired_optimized = [optimized for _, optimized in paired_feasible]

    baseline_averages = _metric_averages(baseline_records)
    optimized_averages = _metric_averages(optimized_records)
    baseline_comparable = _metric_averages(paired_baseline)
    optimized_comparable = _metric_averages(paired_optimized)

    improvement = {
        "cost_reduction_percentage": _round(
            _percentage_improvement(
                baseline_comparable["procurement_cost"],
                optimized_comparable["procurement_cost"],
                lower_is_better=True,
            )
        ),
        "quality_improvement_percentage": _round(
            _percentage_improvement(
                baseline_comparable["quality_score"],
                optimized_comparable["quality_score"],
                lower_is_better=False,
            )
        ),
        "risk_reduction_percentage": _round(
            _percentage_improvement(
                baseline_comparable["risk_exposure"],
                optimized_comparable["risk_exposure"],
                lower_is_better=True,
            )
        ),
        "supplier_dependency_reduction_percentage": _round(
            _percentage_improvement(
                baseline_comparable["supplier_dependency"],
                optimized_comparable["supplier_dependency"],
                lower_is_better=True,
            )
        ),
        "on_time_rate_change_points": _round(
            (optimized_averages["on_time_rate"] or 0) - (baseline_averages["on_time_rate"] or 0)
        ),
        "full_allocation_rate_change_points": _round(
            (optimized_averages["full_allocation_rate"] or 0)
            - (baseline_averages["full_allocation_rate"] or 0)
        ),
        "profit_margin_change_points": (
            _round(optimized_comparable["profit_margin"] - baseline_comparable["profit_margin"])
            if optimized_comparable["profit_margin"] is not None
            and baseline_comparable["profit_margin"] is not None
            else None
        ),
    }

    baseline_costs = [
        float(record["procurement_cost"])
        for record in baseline_records
        if record["fully_allocated"] and record["procurement_cost"] is not None
    ]
    optimized_costs = [
        float(record["procurement_cost"])
        for record in optimized_records
        if record["fully_allocated"] and record["procurement_cost"] is not None
    ]

    result = {
        "product": {"id": product.id, "name": product.name, "sku": product.sku},
        "scenario_count": request.scenario_count,
        "seed": request.seed,
        "baseline_strategy": request.baseline_strategy,
        "baseline_strategy_label": STRATEGY_LABELS.get(
            request.baseline_strategy, request.baseline_strategy
        ),
        "optimized_strategy": request.optimized_strategy,
        "optimized_strategy_label": STRATEGY_LABELS.get(
            request.optimized_strategy, request.optimized_strategy
        ),
        "assumptions": {
            "demand_volatility_percentage": request.demand_volatility_percentage,
            "supplier_price_volatility_percentage": request.supplier_price_volatility_percentage,
            "transportation_volatility_percentage": request.transportation_volatility_percentage,
            "maximum_lead_time_delay_days": request.maximum_lead_time_delay_days,
            "supplier_disruption_probability_percentage": request.supplier_disruption_probability_percentage,
        },
        "comparable_fully_allocated_scenarios": len(paired_feasible),
        "baseline_averages": baseline_averages,
        "optimized_averages": optimized_averages,
        "comparable_baseline_averages": baseline_comparable,
        "comparable_optimized_averages": optimized_comparable,
        "improvement": improvement,
        "optimized_win_rate_percentage": _win_rates(paired_feasible),
        "cost_distribution": {
            "baseline": {
                "p10": _round(_percentile(baseline_costs, 0.10)),
                "median": _round(_percentile(baseline_costs, 0.50)),
                "p90": _round(_percentile(baseline_costs, 0.90)),
            },
            "optimized": {
                "p10": _round(_percentile(optimized_costs, 0.10)),
                "median": _round(_percentile(optimized_costs, 0.50)),
                "p90": _round(_percentile(optimized_costs, 0.90)),
            },
        },
        "methodology": {
            "comparison": "Both strategies receive the same randomized shock in each scenario.",
            "cost_metric_scope": (
                "Cost, quality, risk, dependency, and profit comparisons use only scenarios "
                "where both strategies fully allocate every component."
            ),
            "feasibility_metric_scope": "Allocation and on-time rates use all scenarios.",
            "claim_limit": (
                "These are simulated estimates based on the configured BOM, offers, supplier data, "
                "and shock assumptions; they are not measured production savings."
            ),
        },
        "runtime_ms": round((time.perf_counter() - started) * 1000, 1),
    }
    result["evidence_statement"] = _headline(request, improvement)
    return result
