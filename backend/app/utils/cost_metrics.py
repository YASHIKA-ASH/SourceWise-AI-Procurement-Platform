from app.models.supplier import Supplier


def calculate_cost_metrics(suppliers, required_quantity, best_plan):

    if not suppliers:
        return {}

    cheapest_supplier = min(
        suppliers,
        key=lambda s: s.price_per_unit
    )

    single_supplier_cost = (
        cheapest_supplier.price_per_unit *
        required_quantity
    )

    optimized_cost = best_plan["total_cost"]

    savings = single_supplier_cost - optimized_cost

    savings_percent = round(
        (savings / single_supplier_cost) * 100,
        2
    ) if single_supplier_cost else 0

    return {
        "single_supplier_cost": round(single_supplier_cost, 2),
        "optimized_cost": round(optimized_cost, 2),
        "estimated_savings": round(savings, 2),
        "savings_percent": savings_percent
    }