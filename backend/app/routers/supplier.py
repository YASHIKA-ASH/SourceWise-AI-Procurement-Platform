from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.comparison import calculate_score
from app.database.database import get_db
from app.schemas.supplier import SupplierCreate, SupplierResponse
from app.services.supplier import create_supplier, get_suppliers
from app.models.supplier import Supplier
router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


@router.post("/", response_model=SupplierResponse)
def add_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):
    return create_supplier(db, supplier)


@router.get("/", response_model=list[SupplierResponse])
def read_suppliers(
    db: Session = Depends(get_db)
):
    return get_suppliers(db)

@router.get("/analytics")
def supplier_analytics(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    if not suppliers:
        return {"message": "No suppliers found"}

    total = len(suppliers)

    avg_price = sum(s.price_per_unit for s in suppliers) / total

    avg_quality = sum(s.quality_score for s in suppliers) / total

    avg_delivery = sum(s.on_time_delivery for s in suppliers) / total

    best_supplier = max(
        suppliers,
        key=lambda s: s.quality_score
    )

    return {
        "total_suppliers": total,
        "average_price": round(avg_price,2),
        "average_quality": round(avg_quality,2),
        "average_delivery": round(avg_delivery,2),
        "best_supplier": best_supplier.name
    }
@router.get("/compare")
def compare_suppliers(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    result = []

    for s in suppliers:

        risk = (
            s.defect_rate * 3
            + (100 - s.on_time_delivery) * 0.5
            + (100 - s.sustainability_score) * 0.1
        )

        score = (
            s.quality_score * 0.40
            - s.price_per_unit * 0.02
            - risk * 0.50
        )

        result.append({
            "supplier": s.name,
            "material": s.material,
            "country": s.country,
            "price": s.price_per_unit,
            "quality": s.quality_score,
            "delivery": s.on_time_delivery,
            "risk": round(risk, 2),
            "score": round(score, 2)
        })

    result.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return result
@router.get("/ranking")
def supplier_ranking(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    rankings = []

    for supplier in suppliers:

        rankings.append({
            "supplier": supplier.name,
            "material": supplier.material,
            "country": supplier.country,
            "price_per_unit": supplier.price_per_unit,
            "lead_time": supplier.lead_time,
            "quality_score": supplier.quality_score,
            "on_time_delivery": supplier.on_time_delivery,
            "sustainability_score": supplier.sustainability_score,
            "defect_rate": supplier.defect_rate,
            "overall_score": calculate_score(supplier)
        })

    rankings.sort(
        key=lambda x: x["overall_score"],
        reverse=True
    )

    return rankings
@router.get("/material/{name}")
def get_by_material(name: str, db: Session = Depends(get_db)):
    return db.query(Supplier).filter(
        Supplier.material == name
    ).all()


@router.get("/country/{country}")
def get_by_country(country: str, db: Session = Depends(get_db)):
    return db.query(Supplier).filter(
        Supplier.country == country
    ).all()


@router.get("/best")
def get_best_supplier(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()

    return max(
        suppliers,
        key=lambda s: s.quality_score
    )