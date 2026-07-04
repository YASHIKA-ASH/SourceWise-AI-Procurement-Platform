from pydantic import BaseModel


class InventoryCreate(BaseModel):
    material: str
    current_stock: int
    daily_consumption: int
    safety_stock: int
    unit: str
    warehouse: str


class InventoryResponse(InventoryCreate):
    id: int

    class Config:
        from_attributes = True