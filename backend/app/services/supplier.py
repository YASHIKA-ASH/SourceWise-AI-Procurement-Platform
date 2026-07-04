from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate


def create_supplier(db: Session, supplier: SupplierCreate):
    new_supplier = Supplier(**supplier.model_dump())

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


def get_suppliers(db: Session):
    return db.query(Supplier).all()