from pydantic import BaseModel


class SupplierCreate(BaseModel):
    name: str
    material: str
    price_per_unit: float
    lead_time: int
    quality_score: float
    defect_rate: float
    on_time_delivery: float
    sustainability_score: float
    country: str


class SupplierResponse(SupplierCreate):
    id: int

    class Config:
        from_attributes = True