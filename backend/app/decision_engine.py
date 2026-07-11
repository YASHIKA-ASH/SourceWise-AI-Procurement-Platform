from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.services.risk import calculate_risk
from app.services.scoring import procurement_score

def evaluate(db: Session, quantity, inventory, daily_usage):
    suppliers = db.query(Supplier).all()

    inventory_days = inventory / daily_usage

    results = []

    lowest_price = min(s.price_per_unit for s in suppliers)

    for s in suppliers:

        delay = max(0, s.lead_time - inventory_days)
        cost_efficiency = round((lowest_price / s.price_per_unit) * 100, 2)
        cost = s.price_per_unit * quantity

        risk_value, risk_level = calculate_risk(s)

        production_loss = delay * 250000

        risk = (
            s.defect_rate * 3
            + (100 - s.on_time_delivery) * 0.5
            + (100 - s.sustainability_score) * 0.1
        )
        weighted_risk = (
    s.defect_rate * 3
    + (100 - s.on_time_delivery) * 0.5
    + (100 - s.sustainability_score) * 0.1
        )

        reliability = round(
            (
                s.quality_score
                + s.on_time_delivery
                + (100 - s.defect_rate * 10)
            ) / 3,
            2
        )


        score, procurement_risk = procurement_score(s)
        confidence = round(min(score + 5, 99), 1)
        stockout_days = inventory / daily_usage
        saving=(s.price_per_unit-lowest_price)*quantity
        results.append({
            "price": s.price_per_unit,
            "supplier": s.name,
            "cost": cost,
            "lead_time": s.lead_time,
            "delay_days": round(delay, 2),
            "production_loss": production_loss,
            "estimated_saving":saving,
            "confidence": confidence,
            "score": score,
            "cost_efficiency": cost_efficiency,
            "risk": risk,
            "supplier_reliability": reliability,
            "risk_level":
            "Low" if risk < 10
            else "Medium" if risk < 20
            else "High",


        })

        cost_efficiency = round(
    100 - (s.price_per_unit / 10),
    2
)
    results.sort(key=lambda x: x["score"], reverse=True)
    for i, supplier in enumerate(results):
        supplier["rank"] = i + 1   
    results[0]["stockout_days"] = round(stockout_days,2)
    results[0]["estimated_saving"] = round(saving,2)

    return results