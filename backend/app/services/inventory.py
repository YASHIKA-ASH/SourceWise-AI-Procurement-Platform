from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate


def create_inventory(db: Session, item: InventoryCreate):
    inventory = Inventory(**item.model_dump())

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory


def get_inventory(db: Session):
    return db.query(Inventory).all()