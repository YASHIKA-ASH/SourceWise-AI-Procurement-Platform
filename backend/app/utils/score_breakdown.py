def generate_score_breakdown(supplier):

    reliability = round(supplier.reliability_score * 0.40, 2)

    price = round((100 - supplier.price_per_unit) * 0.25, 2)

    delivery = round((30 - supplier.delivery_days) * 0.20, 2)

    risk = round((100 - supplier.risk_score) * 0.15, 2)

    total = round(
        reliability +
        price +
        delivery +
        risk,
        2
    )

    return {
        "reliability": reliability,
        "price": price,
        "delivery": delivery,
        "risk": risk,
        "total": total
    }