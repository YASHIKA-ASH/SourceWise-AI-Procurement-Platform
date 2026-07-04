from sqlalchemy.orm import Session
from app.models.supplier import Supplier


def evaluate(db: Session, quantity, inventory, daily_usage):

    suppliers = db.query(Supplier).all()

    inventory_days = inventory / daily_usage

    results = []

    for s in suppliers:

        delay = max(0, s.lead_time - inventory_days)

        cost = s.price_per_unit * quantity

        production_loss = delay * 250000

        risk = (
            s.defect_rate * 3
            + (100 - s.on_time_delivery) * 0.5
            + (100 - s.sustainability_score) * 0.1
        )

        score = (
            s.quality_score * 0.40
            - s.price_per_unit * 0.02
            - risk * 0.50
            - delay * 2
        )

        results.append({
            "supplier": s.name,
            "cost": cost,
            "lead_time": s.lead_time,
            "delay_days": round(delay, 2),
            "score": round(score, 2),
            "production_loss": production_loss,
            "risk": round(risk, 2)
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    return results