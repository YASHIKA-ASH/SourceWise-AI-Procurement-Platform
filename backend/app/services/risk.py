def calculate_risk(supplier):

    risk = (
        supplier.defect_rate * 3
        + (100 - supplier.on_time_delivery) * 0.5
        + (100 - supplier.sustainability_score) * 0.2
    )

    if risk < 10:
        level = "Low"
    elif risk < 20:
        level = "Medium"
    else:
        level = "High"

    return round(risk, 2), level