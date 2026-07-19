from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.utils.risk_calculator import calculate_risk


def get_supplier_risk(db: Session):
    suppliers = db.query(Supplier).all()

    results = []

    for supplier in suppliers:
        risk = calculate_risk(supplier)

        results.append({
            "supplier_id": supplier.id,
            "supplier_name": supplier.name,
            "material": supplier.material,
            "country": supplier.country,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "reasons": risk["reasons"]
        })

    results.sort(
        key=lambda x: x["risk_score"],
        reverse=True
    )

    return results