from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.services.cache import get_cached_suppliers, cache_suppliers
from app.services.risk import calculate_risk
from app.services.scoring import procurement_score
from app.utils.timer import Timer


def evaluate(db: Session, quantity, inventory, daily_usage):

    sql_timer = Timer()

    cached = get_cached_suppliers()

    if cached:

        print("✅ Supplier Cache Hit")

        suppliers = [
            Supplier(**item)
            for item in cached
        ]

        cache_hit = True

    else:

        print("❌ Supplier Cache Miss")

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
                    "response_time": s.response_time,
                }
                for s in suppliers
            ]
        )

        cache_hit = False

    sql_time = sql_timer.stop()

    print(f"SQL/Cache Time : {sql_time} ms")

    if not suppliers:
        return {
            "results": [],
            "sql_time": sql_time,
            "cache_hit": cache_hit
        }

    inventory_days = inventory / daily_usage
    stockout_days = inventory_days

    lowest_price = min(
        s.price_per_unit
        for s in suppliers
    )

    results = []

    for s in suppliers:

        delay = max(
            0,
            s.lead_time - inventory_days
        )

        cost = s.price_per_unit * quantity

        cost_efficiency = round(
            (lowest_price / s.price_per_unit) * 100,
            2
        )

        _, risk_level = calculate_risk(s)

        weighted_risk = round(
            (
                s.defect_rate * 3
                + (100 - s.on_time_delivery) * 0.5
                + (100 - s.sustainability_score) * 0.1
            ),
            2
        )

        production_loss = round(
            delay * 250000,
            2
        )

        reliability = round(
            (
                s.quality_score
                + s.on_time_delivery
                + (100 - s.defect_rate * 10)
            ) / 3,
            2
        )

        score, _ = procurement_score(s)

        confidence = round(
            min(score + 5, 99),
            1
        )

        estimated_saving = round(
            (s.price_per_unit - lowest_price) * quantity,
            2
        )

        results.append({
            "supplier": s.name,
            "price": s.price_per_unit,
            "cost": round(cost, 2),
            "lead_time": s.lead_time,
            "delay_days": round(delay, 2),
            "production_loss": production_loss,
            "estimated_saving": estimated_saving,
            "confidence": confidence,
            "score": round(score, 2),
            "cost_efficiency": cost_efficiency,
            "risk": weighted_risk,
            "supplier_reliability": reliability,
            "risk_level": risk_level
        })

    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    for i, supplier in enumerate(results, start=1):
        supplier["rank"] = i

    results[0]["stockout_days"] = round(
        stockout_days,
        2
    )

    return {
        "results": results,
        "sql_time": sql_time,
        "cache_hit": cache_hit
    }