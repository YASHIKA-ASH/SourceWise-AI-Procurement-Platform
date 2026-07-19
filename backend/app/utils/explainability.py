def generate_explanation(supplier):
    reasons = []

    if supplier.reliability_score >= 90:
        reasons.append("High reliability score")

    elif supplier.reliability_score >= 80:
        reasons.append("Good reliability score")

    if supplier.delivery_days <= 5:
        reasons.append("Fast delivery time")

    elif supplier.delivery_days <= 10:
        reasons.append("Acceptable delivery time")

    if supplier.price_per_unit <= 90:
        reasons.append("Competitive pricing")

    if supplier.capacity_per_month >= 10000:
        reasons.append("Large production capacity")

    if supplier.risk_score <= 25:
        reasons.append("Low procurement risk")

    return reasons