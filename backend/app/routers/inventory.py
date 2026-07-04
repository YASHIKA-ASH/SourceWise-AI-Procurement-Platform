from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.inventory import (
    InventoryCreate,
    InventoryResponse
)

from app.services.inventory import (
    create_inventory,
    get_inventory
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


@router.post("/", response_model=InventoryResponse)
def add_inventory(
    item: InventoryCreate,
    db: Session = Depends(get_db)
):
    return create_inventory(db, item)


@router.get("/", response_model=list[InventoryResponse])
def read_inventory(
    db: Session = Depends(get_db)
):
    return get_inventory(db)