from app.models.supplier import Supplier


def calculate_score(supplier):

    cost_score = 100 - (supplier.price_per_unit / 10)

    quality_score = supplier.quality_score

    delivery_score = supplier.on_time_delivery

    sustainability_score = supplier.sustainability_score

    defect_penalty = supplier.defect_rate * 5

    total = (
        cost_score * 0.30
        + quality_score * 0.30
        + delivery_score * 0.20
        + sustainability_score * 0.10
        - defect_penalty
    )

    return round(total, 2)