from types import SimpleNamespace

from app.services.procurement import landed_cost_breakdown


def test_landed_cost_breakdown():
    offer = SimpleNamespace(
        unit_price=100,
        transportation_cost_per_unit=5,
        customs_import_duty_percentage=10,
        packaging_cost_per_unit=2,
        warehousing_cost_per_unit=1,
        tax_percentage=18,
        delay_related_cost_per_unit=3,
    )
    result = landed_cost_breakdown(offer, 10)
    assert result["material_cost"] == 1000
    assert result["transportation_cost"] == 50
    assert result["customs_import_duty"] == 100
    assert result["total_landed_cost"] == 1422.4
