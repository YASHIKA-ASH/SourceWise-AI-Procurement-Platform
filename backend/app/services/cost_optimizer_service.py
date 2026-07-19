from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.utils.cost_optimizer import optimize_procurement
from app.utils.cost_metrics import calculate_cost_metrics


def get_cost_optimization(db: Session, required_quantity: int):

    suppliers = db.query(Supplier).all()

    results = optimize_procurement(
        suppliers,
        required_quantity
    )

    if not results:
        return {
            "required_quantity": required_quantity,
            "message": "No supplier combination can satisfy the requested quantity.",
            "recommendations": []
        }

    best = results[0]

    metrics = calculate_cost_metrics(
        suppliers,
        required_quantity,
        best
    )

    return {
        "required_quantity": required_quantity,
        "metrics": metrics,
        "best_plan": best,
        "recommendations": results
    }