from app.services.procurement import _select_guardrailed_plan


def _plan(
    strategy: str,
    *,
    cost: float,
    quality: float,
    risk: float,
    dependency: float = 50,
    on_time: float = 80,
    shortfall: float = 0,
    fully_allocated: bool = True,
):
    return {
        "strategy": strategy,
        "summary": {
            "final_product_procurement_cost": cost,
            "average_quality_score": quality,
            "average_risk_exposure": risk,
            "supplier_dependency_percentage": dependency,
            "on_time_allocation_rate": on_time,
            "total_shortfall": shortfall,
            "all_components_fully_allocated": fully_allocated,
        },
    }


def test_guardrail_rejects_cheaper_plan_that_worsens_quality_and_risk():
    baseline = _plan("manual_baseline", cost=100, quality=90, risk=20)
    unsafe = _plan("lowest_cost", cost=90, quality=85, risk=30)

    selected, fallback_used = _select_guardrailed_plan(baseline, [unsafe])

    assert selected is baseline
    assert fallback_used is True


def test_guardrail_selects_non_dominated_lower_cost_plan():
    baseline = _plan("manual_baseline", cost=100, quality=90, risk=20)
    improved = _plan("balanced", cost=92, quality=92, risk=18, dependency=45, on_time=85)

    selected, fallback_used = _select_guardrailed_plan(baseline, [improved])

    assert selected is improved
    assert fallback_used is False


def test_infeasible_baseline_prefers_complete_candidate():
    baseline = _plan(
        "manual_baseline",
        cost=70,
        quality=80,
        risk=30,
        shortfall=20,
        fully_allocated=False,
    )
    candidate = _plan("balanced", cost=100, quality=85, risk=25, fully_allocated=True)

    selected, fallback_used = _select_guardrailed_plan(baseline, [candidate])

    assert selected is candidate
    assert fallback_used is False
