from types import SimpleNamespace

from app.benchmark_schemas import SimulationBenchmarkRequest
from app.services.simulation_benchmark import run_simulation_benchmark


def _result(_product, _settings, strategy: str, **_):
    optimized = strategy == "balanced"
    return {
        "component_results": [
            {
                "status": "fully_allocated",
                "allocations": [{"on_time": optimized}],
            }
        ],
        "summary": {
            "final_product_procurement_cost": 90 if optimized else 100,
            "average_quality_score": 88 if optimized else 80,
            "average_risk_exposure": 18 if optimized else 30,
            "supplier_dependency_percentage": 40 if optimized else 50,
            "expected_profit_margin": 22 if optimized else 20,
            "all_components_fully_allocated": True,
        },
    }


def test_benchmark_calculates_improvements():
    offer = SimpleNamespace(supplier_id=1)
    component = SimpleNamespace(offers=[offer])
    product = SimpleNamespace(id=1, name="Test", sku="T-1", components=[component])
    settings = SimpleNamespace()
    request = SimulationBenchmarkRequest(scenario_count=50, seed=1)

    result = run_simulation_benchmark(
        product,
        settings,
        request,
        recommendation_fn=_result,
    )

    assert result["scenario_count"] == 50
    assert result["improvement"]["cost_reduction_percentage"] == 10.0
    assert result["improvement"]["risk_reduction_percentage"] == 40.0
    assert result["improvement"]["quality_improvement_percentage"] == 10.0
    assert result["improvement"]["full_allocation_rate_change_points"] == 0.0
    assert "50 simulated purchasing scenarios" in result["evidence_statement"]
