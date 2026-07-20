from app.models.supplier import Supplier


def calculate_score(supplier: Supplier):

    # Lower price = higher score
    cost_score = max(0, 100 - supplier.price_per_unit)

    # Lower lead time = higher score
    lead_time_score = max(0, 100 - (supplier.lead_time * 2))

    quality_score = supplier.quality_score
    delivery_score = supplier.on_time_delivery
    sustainability_score = supplier.sustainability_score

    # Higher defect rate reduces score
    defect_penalty = supplier.defect_rate * 5

    total_score = (
        cost_score * 0.25 +
        quality_score * 0.25 +
        delivery_score * 0.20 +
        lead_time_score * 0.15 +
        sustainability_score * 0.15
    ) - defect_penalty

    return round(max(total_score, 0), 2)