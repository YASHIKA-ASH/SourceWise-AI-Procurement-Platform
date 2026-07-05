WEIGHTS = {
    "cost": 0.30,
    "quality": 0.30,
    "delivery": 0.20,
    "sustainability": 0.10,
    "risk": 0.10,
}


def procurement_score(s):

    risk = (
        s.defect_rate * 3
        + (100 - s.on_time_delivery) * 0.5
        + (100 - s.sustainability_score) * 0.2
    )

    cost_score = max(0, 100 - s.price_per_unit / 5)

    total = (
        cost_score * WEIGHTS["cost"]
        + s.quality_score * WEIGHTS["quality"]
        + s.on_time_delivery * WEIGHTS["delivery"]
        + s.sustainability_score * WEIGHTS["sustainability"]
        + (100 - risk) * WEIGHTS["risk"]
    )

    return round(total, 2), round(risk, 2)