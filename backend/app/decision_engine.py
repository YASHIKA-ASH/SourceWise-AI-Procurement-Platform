from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.services.risk import calculate_risk
from app.services.scoring import procurement_score
from app.utils.timer import Timer
from app.services.cache import get_cached_suppliers, cache_suppliers
import json



def evaluate(db: Session, quantity, inventory, daily_usage):

    
    sql_timer = Timer()


    cached = get_cached_suppliers()

    if cached:

            print(" Supplier Cache Hit")

            suppliers = [
                Supplier(**item)
                for item in cached
            ]

            cache_hit = True

    else:

            print(" Supplier Cache Miss")

            suppliers = db.query(Supplier).all()

            cache_suppliers(
                [
                    {
                        "id": s.id,
                        "name": s.name,
                        "material": s.material,
                        "price_per_unit": s.price_per_unit,
                        "lead_time": s.lead_time,
                        "quality_score": s.quality_score,
                        "defect_rate": s.defect_rate,
                        "on_time_delivery": s.on_time_delivery,
                        "sustainability_score": s.sustainability_score,
                        "country": s.country,
                        "supplier_rating": s.supplier_rating,
                        "capacity_per_month": s.capacity_per_month,
                        "certification": s.certification,
                        "response_time": s.response_time
                    }
                    for s in suppliers
                ]
            )

            cache_hit = False

    sql_time = sql_timer.stop()

    print(f"SQL/Cache Time : {sql_time} ms")


    print(f"SQL/Cache Time : {sql_time} ms")

    inventory_days = inventory / daily_usage
    stockout_days = inventory_days

    results = []
    lowest_price = min(s.price_per_unit for s in suppliers)

    for s in suppliers:

            delay = max(0, s.lead_time - inventory_days)

            cost = s.price_per_unit * quantity

            cost_efficiency = round(
                (lowest_price / s.price_per_unit) * 100,
                2
            )

            risk_value, risk_level = calculate_risk(s)

            production_loss = delay * 250000

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

            confidence = round(
                min(score + 5, 99),
                1
            )

            saving = (
                s.price_per_unit - lowest_price
            ) * quantity

            results.append({
                "price": s.price_per_unit,
                "supplier": s.name,
                "cost": cost,
                "lead_time": s.lead_time,
                "delay_days": round(delay, 2),
                "production_loss": production_loss,
                "estimated_saving": round(saving, 2),
                "confidence": confidence,
                "score": score,
                "cost_efficiency": cost_efficiency,
                "risk": weighted_risk,
                "supplier_reliability": reliability,
                "risk_level": (
                    "Low"
                    if weighted_risk < 10
                    else "Medium"
                    if weighted_risk < 20
                    else "High"
                )
            })

    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    for i, supplier in enumerate(results):
        supplier["rank"] = i + 1

    if results:
        results[0]["stockout_days"] = round(stockout_days, 2)

        return {
        "results": results,
        "sql_time": sql_time,
        "cache_hit": cache_hit
        }

