def calculate_risk(supplier):
    score = 0
    reasons = []

    # Lead Time
    if supplier.lead_time > 10:
        score += 20
        reasons.append("High lead time")
    elif supplier.lead_time > 7:
        score += 10

    # Defect Rate
    if supplier.defect_rate > 5:
        score += 20
        reasons.append("High defect rate")
    elif supplier.defect_rate > 2:
        score += 10

    # On-Time Delivery
    if supplier.on_time_delivery < 80:
        score += 20
        reasons.append("Poor on-time delivery")
    elif supplier.on_time_delivery < 90:
        score += 10

    # Supplier Rating
    if supplier.supplier_rating < 3:
        score += 15
        reasons.append("Low supplier rating")
    elif supplier.supplier_rating < 4:
        score += 8

    # Sustainability
    if supplier.sustainability_score < 60:
        score += 10
        reasons.append("Low sustainability score")

    # Quality
    if supplier.quality_score < 80:
        score += 15
        reasons.append("Low quality score")

    # Capacity
    if supplier.capacity_per_month < 1000:
        score += 10
        reasons.append("Low production capacity")

    # Response Time
    if supplier.response_time > 48:
        score += 10
        reasons.append("Slow response time")

    score = min(score, 100)

    if score <= 30:
        level = "Low"
    elif score <= 60:
        level = "Medium"
    else:
        level = "High"

    return {
        "risk_score": score,
        "risk_level": level,
        "reasons": reasons
    }