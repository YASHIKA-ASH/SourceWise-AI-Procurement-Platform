from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import BOMComponent, EnterpriseSettings, Product, Supplier, SupplierOffer


def seed_database(db: Session) -> None:
    if db.scalar(select(Product.id).limit(1)):
        return

    settings = EnterpriseSettings(
        name="Demo Manufacturing Enterprise",
        cost_weight=0.30,
        quality_weight=0.30,
        lead_time_weight=0.20,
        risk_weight=0.20,
        maximum_lead_time_days=35,
        minimum_quality_rating=70,
        require_iso_certification=False,
        maximum_risk_score=65,
        require_domestic_supplier=False,
        maximum_supplier_share_percentage=70,
        approved_suppliers_only=True,
    )
    product = Product(
        name="Smart Water Purifier",
        sku="SWP-1000",
        target_manufacturing_cost=30000,
        expected_selling_price=40000,
        minimum_profit_margin=25,
        maximum_procurement_budget=32000,
        production_days=5,
    )
    db.add_all([settings, product])
    db.flush()

    components = [
        BOMComponent(
            product_id=product.id,
            part_name="High-pressure pump",
            category="Mechanical",
            required_quantity=10000,
            current_inventory=900,
            reserved_inventory=200,
            safety_stock=300,
            default_minimum_order_quantity=500,
            required_delivery_date=date.today() + timedelta(days=24),
            is_critical=True,
        ),
        BOMComponent(
            product_id=product.id,
            part_name="Control PCB",
            category="Electronics",
            required_quantity=5000,
            current_inventory=600,
            reserved_inventory=100,
            safety_stock=150,
            default_minimum_order_quantity=250,
            required_delivery_date=date.today() + timedelta(days=28),
            is_critical=True,
        ),
        BOMComponent(
            product_id=product.id,
            part_name="Outer housing",
            category="Plastics",
            required_quantity=5000,
            current_inventory=1200,
            reserved_inventory=0,
            safety_stock=200,
            default_minimum_order_quantity=200,
            required_delivery_date=date.today() + timedelta(days=20),
            is_critical=False,
        ),
    ]
    db.add_all(components)
    db.flush()

    suppliers = [
        Supplier(
            name="Apex Components",
            country="India",
            is_domestic=True,
            is_approved=True,
            iso_certified=True,
            quality_rating=91,
            risk_score=24,
            on_time_delivery_percentage=94,
            average_lead_time_days=13,
            defect_percentage=1.1,
            fulfilment_percentage=96,
            contract_compliance_percentage=97,
            monthly_production_capacity=15000,
            current_committed_capacity=0,
            maximum_order_size=7000,
            historical_spending=1800000,
        ),
        Supplier(
            name="BlueRiver Industrial",
            country="Vietnam",
            is_domestic=False,
            is_approved=True,
            iso_certified=True,
            quality_rating=88,
            risk_score=31,
            on_time_delivery_percentage=89,
            average_lead_time_days=19,
            defect_percentage=1.8,
            fulfilment_percentage=93,
            contract_compliance_percentage=92,
            monthly_production_capacity=12000,
            current_committed_capacity=3000,
            maximum_order_size=5000,
            historical_spending=1250000,
        ),
        Supplier(
            name="CoreFab Manufacturing",
            country="India",
            is_domestic=True,
            is_approved=True,
            iso_certified=False,
            quality_rating=79,
            risk_score=42,
            on_time_delivery_percentage=84,
            average_lead_time_days=10,
            defect_percentage=3.0,
            fulfilment_percentage=87,
            contract_compliance_percentage=86,
            monthly_production_capacity=12000,
            current_committed_capacity=2500,
            maximum_order_size=4500,
            historical_spending=760000,
        ),
    ]
    db.add_all(suppliers)
    db.flush()

    offers = []
    prices = {
        components[0].id: [(suppliers[0], 2.60, 0.12, 0, 13, 500), (suppliers[1], 2.35, 0.24, 8, 20, 1000), (suppliers[2], 2.48, 0.10, 0, 11, 500)],
        components[1].id: [(suppliers[0], 3.90, 0.08, 0, 15, 250), (suppliers[1], 3.55, 0.20, 10, 24, 500), (suppliers[2], 3.70, 0.09, 0, 12, 250)],
        components[2].id: [(suppliers[0], 1.75, 0.10, 0, 12, 200), (suppliers[1], 1.50, 0.18, 7, 18, 500), (suppliers[2], 1.62, 0.08, 0, 9, 200)],
    }
    for component_id, rows in prices.items():
        for supplier, unit_price, transport, duty, lead, moq in rows:
            offers.append(
                SupplierOffer(
                    component_id=component_id,
                    supplier_id=supplier.id,
                    unit_price=unit_price,
                    transportation_cost_per_unit=transport,
                    customs_import_duty_percentage=duty,
                    packaging_cost_per_unit=0.04,
                    warehousing_cost_per_unit=0.03,
                    tax_percentage=18,
                    delay_related_cost_per_unit=0.02,
                    lead_time_days=lead,
                    minimum_order_quantity=moq,
                )
            )
    db.add_all(offers)
    db.commit()
