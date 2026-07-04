from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/simulator",
    tags=["Procurement Simulator"]
)


class SimulationInput(BaseModel):
    required_quantity: int
    current_inventory: int
    daily_consumption: int


SUPPLIERS = [
    {
        "name": "Tata Steel",
        "price": 420,
        "lead_time": 12,
        "quality": 97,
        "risk": 8
    },
    {
        "name": "JSW Steel",
        "price": 395,
        "lead_time": 20,
        "quality": 91,
        "risk": 25
    },
    {
        "name": "ArcelorMittal",
        "price": 430,
        "lead_time": 10,
        "quality": 99,
        "risk": 5
    }
]


@router.post("/")
def simulate(data: SimulationInput):

    results = []

    for supplier in SUPPLIERS:

        procurement_cost = supplier["price"] * data.required_quantity

        inventory_days = data.current_inventory / data.daily_consumption

        delay = max(
            supplier["lead_time"] - inventory_days,
            0
        )

        score = (
            supplier["quality"] * 0.4
            - supplier["price"] * 0.03
            - supplier["risk"] * 0.5
            - delay * 2
        )

        results.append({

            "supplier": supplier["name"],

            "procurement_cost": procurement_cost,

            "lead_time_days": supplier["lead_time"],

            "inventory_coverage_days": round(inventory_days, 1),

            "production_delay_days": round(delay, 1),

            "overall_score": round(score, 2)
        })

    best = max(results, key=lambda x: x["overall_score"])

    return {
        "recommended_supplier": best,
        "all_suppliers": results
    }