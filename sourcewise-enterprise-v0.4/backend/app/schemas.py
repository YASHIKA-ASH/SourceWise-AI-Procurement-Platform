from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sku: str = Field(min_length=1, max_length=60)
    target_manufacturing_cost: float | None = Field(default=None, ge=0)
    expected_selling_price: float | None = Field(default=None, ge=0)
    minimum_profit_margin: float | None = Field(default=None, ge=0, le=100)
    maximum_procurement_budget: float | None = Field(default=None, ge=0)
    production_days: int = Field(default=7, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    sku: str | None = Field(default=None, min_length=1, max_length=60)
    target_manufacturing_cost: float | None = Field(default=None, ge=0)
    expected_selling_price: float | None = Field(default=None, ge=0)
    minimum_profit_margin: float | None = Field(default=None, ge=0, le=100)
    maximum_procurement_budget: float | None = Field(default=None, ge=0)
    production_days: int | None = Field(default=None, ge=0)


class ProductRead(ProductCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ComponentCreate(BaseModel):
    part_name: str = Field(min_length=1, max_length=160)
    category: str = Field(default="Uncategorized", max_length=80)
    required_quantity: float = Field(gt=0)
    current_inventory: float = Field(default=0, ge=0)
    reserved_inventory: float = Field(default=0, ge=0)
    safety_stock: float = Field(default=0, ge=0)
    default_minimum_order_quantity: float = Field(default=1, gt=0)
    required_delivery_date: date
    is_critical: bool = True


class ComponentUpdate(BaseModel):
    part_name: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = Field(default=None, max_length=80)
    required_quantity: float | None = Field(default=None, gt=0)
    current_inventory: float | None = Field(default=None, ge=0)
    reserved_inventory: float | None = Field(default=None, ge=0)
    safety_stock: float | None = Field(default=None, ge=0)
    default_minimum_order_quantity: float | None = Field(default=None, gt=0)
    required_delivery_date: date | None = None
    is_critical: bool | None = None


class ComponentRead(ComponentCreate):
    id: int
    product_id: int
    model_config = ConfigDict(from_attributes=True)


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    country: str = Field(min_length=1, max_length=80)
    is_domestic: bool = False
    is_approved: bool = True
    iso_certified: bool = False
    quality_rating: float = Field(default=75, ge=0, le=100)
    risk_score: float = Field(default=25, ge=0, le=100)
    on_time_delivery_percentage: float = Field(default=80, ge=0, le=100)
    average_lead_time_days: float = Field(default=14, ge=0)
    defect_percentage: float = Field(default=2, ge=0, le=100)
    fulfilment_percentage: float = Field(default=90, ge=0, le=100)
    contract_compliance_percentage: float = Field(default=90, ge=0, le=100)
    monthly_production_capacity: float = Field(default=0, ge=0)
    current_committed_capacity: float = Field(default=0, ge=0)
    maximum_order_size: float = Field(default=0, ge=0)
    historical_spending: float = Field(default=0, ge=0)


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=140)
    country: str | None = Field(default=None, min_length=1, max_length=80)
    is_domestic: bool | None = None
    is_approved: bool | None = None
    iso_certified: bool | None = None
    quality_rating: float | None = Field(default=None, ge=0, le=100)
    risk_score: float | None = Field(default=None, ge=0, le=100)
    on_time_delivery_percentage: float | None = Field(default=None, ge=0, le=100)
    average_lead_time_days: float | None = Field(default=None, ge=0)
    defect_percentage: float | None = Field(default=None, ge=0, le=100)
    fulfilment_percentage: float | None = Field(default=None, ge=0, le=100)
    contract_compliance_percentage: float | None = Field(default=None, ge=0, le=100)
    monthly_production_capacity: float | None = Field(default=None, ge=0)
    current_committed_capacity: float | None = Field(default=None, ge=0)
    maximum_order_size: float | None = Field(default=None, ge=0)
    historical_spending: float | None = Field(default=None, ge=0)


class SupplierRead(SupplierCreate):
    id: int
    available_capacity: float
    model_config = ConfigDict(from_attributes=True)


class OfferCreate(BaseModel):
    supplier_id: int
    unit_price: float = Field(gt=0)
    transportation_cost_per_unit: float = Field(default=0, ge=0)
    customs_import_duty_percentage: float = Field(default=0, ge=0)
    packaging_cost_per_unit: float = Field(default=0, ge=0)
    warehousing_cost_per_unit: float = Field(default=0, ge=0)
    tax_percentage: float = Field(default=0, ge=0)
    delay_related_cost_per_unit: float = Field(default=0, ge=0)
    lead_time_days: int = Field(default=14, ge=0)
    minimum_order_quantity: float = Field(default=1, gt=0)


class OfferUpdate(BaseModel):
    supplier_id: int | None = None
    unit_price: float | None = Field(default=None, gt=0)
    transportation_cost_per_unit: float | None = Field(default=None, ge=0)
    customs_import_duty_percentage: float | None = Field(default=None, ge=0)
    packaging_cost_per_unit: float | None = Field(default=None, ge=0)
    warehousing_cost_per_unit: float | None = Field(default=None, ge=0)
    tax_percentage: float | None = Field(default=None, ge=0)
    delay_related_cost_per_unit: float | None = Field(default=None, ge=0)
    lead_time_days: int | None = Field(default=None, ge=0)
    minimum_order_quantity: float | None = Field(default=None, gt=0)


class OfferRead(OfferCreate):
    id: int
    component_id: int
    supplier_name: str | None = None


class SettingsUpdate(BaseModel):
    name: str = "Default Enterprise"
    cost_weight: float = Field(default=0.30, ge=0, le=1)
    quality_weight: float = Field(default=0.30, ge=0, le=1)
    lead_time_weight: float = Field(default=0.20, ge=0, le=1)
    risk_weight: float = Field(default=0.20, ge=0, le=1)
    maximum_lead_time_days: int | None = Field(default=None, ge=0)
    minimum_quality_rating: float | None = Field(default=None, ge=0, le=100)
    require_iso_certification: bool = False
    maximum_risk_score: float | None = Field(default=None, ge=0, le=100)
    require_domestic_supplier: bool = False
    maximum_supplier_share_percentage: float = Field(default=100, gt=0, le=100)
    approved_suppliers_only: bool = True
    enforce_minimum_order_quantity: bool = True

    @model_validator(mode="after")
    def weights_total_one(self):
        total = self.cost_weight + self.quality_weight + self.lead_time_weight + self.risk_weight
        if abs(total - 1.0) > 0.0001:
            raise ValueError("Supplier scoring weights must total 1.0")
        return self


class ScenarioRequest(BaseModel):
    strategy: str = "balanced"
    supplier_price_change_percentage: float = 0
    unavailable_supplier_ids: list[int] = Field(default_factory=list)
    demand_change_percentage: float = 0
    lead_time_delay_days: int = 0
    transportation_cost_change_percentage: float = 0
    domestic_suppliers_only: bool = False
    cost_weight: float | None = Field(default=None, ge=0, le=1)
    quality_weight: float | None = Field(default=None, ge=0, le=1)
    lead_time_weight: float | None = Field(default=None, ge=0, le=1)
    risk_weight: float | None = Field(default=None, ge=0, le=1)


class CopilotQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    strategy: str = Field(default="balanced")
    top_k: int = Field(default=5, ge=1, le=10)
