from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate
from app.database.redis import redis_client

def create_supplier(db: Session, supplier: SupplierCreate):
    new_supplier = Supplier(**supplier.model_dump())

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    db.refresh(new_supplier)

    redis_client.delete("suppliers")

    print("🗑 Supplier cache invalidated")

    return new_supplier

        


def get_suppliers(db: Session):
    return db.query(Supplier).all()