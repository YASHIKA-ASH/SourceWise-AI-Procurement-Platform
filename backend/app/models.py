from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    sku: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    target_manufacturing_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_selling_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    minimum_profit_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    maximum_procurement_budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    production_days: Mapped[int] = mapped_column(Integer, default=7)

    components: Mapped[list["BOMComponent"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class BOMComponent(Base):
    __tablename__ = "bom_components"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    part_name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str] = mapped_column(String(80), default="Uncategorized")
    required_quantity: Mapped[float] = mapped_column(Float)
    current_inventory: Mapped[float] = mapped_column(Float, default=0)
    reserved_inventory: Mapped[float] = mapped_column(Float, default=0)
    safety_stock: Mapped[float] = mapped_column(Float, default=0)
    default_minimum_order_quantity: Mapped[float] = mapped_column(Float, default=1)
    required_delivery_date: Mapped[date] = mapped_column(Date)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=True)

    product: Mapped[Product] = relationship(back_populates="components")
    offers: Mapped[list["SupplierOffer"]] = relationship(
        back_populates="component", cascade="all, delete-orphan"
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    country: Mapped[str] = mapped_column(String(80))
    is_domestic: Mapped[bool] = mapped_column(Boolean, default=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True)
    iso_certified: Mapped[bool] = mapped_column(Boolean, default=False)
    quality_rating: Mapped[float] = mapped_column(Float, default=75)
    risk_score: Mapped[float] = mapped_column(Float, default=25)
    on_time_delivery_percentage: Mapped[float] = mapped_column(Float, default=80)
    average_lead_time_days: Mapped[float] = mapped_column(Float, default=14)
    defect_percentage: Mapped[float] = mapped_column(Float, default=2)
    fulfilment_percentage: Mapped[float] = mapped_column(Float, default=90)
    contract_compliance_percentage: Mapped[float] = mapped_column(Float, default=90)
    monthly_production_capacity: Mapped[float] = mapped_column(Float, default=0)
    current_committed_capacity: Mapped[float] = mapped_column(Float, default=0)
    maximum_order_size: Mapped[float] = mapped_column(Float, default=0)
    historical_spending: Mapped[float] = mapped_column(Float, default=0)

    offers: Mapped[list["SupplierOffer"]] = relationship(back_populates="supplier")

    @property
    def available_capacity(self) -> float:
        return max(self.monthly_production_capacity - self.current_committed_capacity, 0)


class SupplierOffer(Base):
    __tablename__ = "supplier_offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    component_id: Mapped[int] = mapped_column(ForeignKey("bom_components.id", ondelete="CASCADE"), index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"), index=True)
    unit_price: Mapped[float] = mapped_column(Float)
    transportation_cost_per_unit: Mapped[float] = mapped_column(Float, default=0)
    customs_import_duty_percentage: Mapped[float] = mapped_column(Float, default=0)
    packaging_cost_per_unit: Mapped[float] = mapped_column(Float, default=0)
    warehousing_cost_per_unit: Mapped[float] = mapped_column(Float, default=0)
    tax_percentage: Mapped[float] = mapped_column(Float, default=0)
    delay_related_cost_per_unit: Mapped[float] = mapped_column(Float, default=0)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=14)
    minimum_order_quantity: Mapped[float] = mapped_column(Float, default=1)

    component: Mapped[BOMComponent] = relationship(back_populates="offers")
    supplier: Mapped[Supplier] = relationship(back_populates="offers")


class EnterpriseSettings(Base):
    __tablename__ = "enterprise_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), default="Default Enterprise")
    cost_weight: Mapped[float] = mapped_column(Float, default=0.30)
    quality_weight: Mapped[float] = mapped_column(Float, default=0.30)
    lead_time_weight: Mapped[float] = mapped_column(Float, default=0.20)
    risk_weight: Mapped[float] = mapped_column(Float, default=0.20)
    maximum_lead_time_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    minimum_quality_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    require_iso_certification: Mapped[bool] = mapped_column(Boolean, default=False)
    maximum_risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    require_domestic_supplier: Mapped[bool] = mapped_column(Boolean, default=False)
    maximum_supplier_share_percentage: Mapped[float] = mapped_column(Float, default=100)
    approved_suppliers_only: Mapped[bool] = mapped_column(Boolean, default=True)
    enforce_minimum_order_quantity: Mapped[bool] = mapped_column(Boolean, default=True)
