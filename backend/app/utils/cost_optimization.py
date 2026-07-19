from itertools import combinations


def optimize_procurement(suppliers, required_quantity):

    results = []

    for supplier in suppliers:

        if supplier.capacity_per_month >= required_quantity:

            total_cost = supplier.price_per_unit * required_quantity

            results.append({
                "suppliers": [supplier.name],
                "quantity_split": {
                    supplier.name: required_quantity
                },
                "total_cost": round(total_cost, 2),
                "average_price": supplier.price_per_unit,
                "supplier_count": 1
            })

    for s1, s2 in combinations(suppliers, 2):

        total_capacity = (
            s1.capacity_per_month +
            s2.capacity_per_month
        )

        if total_capacity < required_quantity:
            continue

        qty1 = min(
            s1.capacity_per_month,
            required_quantity
        )

        qty2 = required_quantity - qty1

        total_cost = (
            qty1 * s1.price_per_unit +
            qty2 * s2.price_per_unit
        )

        avg_price = total_cost / required_quantity

        results.append({
            "suppliers": [
                s1.name,
                s2.name
            ],
            "quantity_split": {
                s1.name: qty1,
                s2.name: qty2
            },
            "total_cost": round(total_cost, 2),
            "average_price": round(avg_price, 2),
            "supplier_count": 2
        })

    results.sort(
        key=lambda x: x["total_cost"]
    )

    return results[:10]