from pydantic import BaseModel


class SupplierRiskResponse(BaseModel):
    supplier_id: int
    supplier_name: str
    material: str
    country: str
    risk_score: int
    risk_level: str
    reasons: list[str]

    class Config:
        from_attributes = True