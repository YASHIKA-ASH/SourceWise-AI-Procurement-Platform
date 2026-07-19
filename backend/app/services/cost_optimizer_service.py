from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.utils.cost_optimizer import optimize_procurement


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

    return {
        "required_quantity": required_quantity,
        "best_plan": best,
        "recommendations": results
    }