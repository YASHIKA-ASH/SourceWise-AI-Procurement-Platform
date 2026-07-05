from fastapi import APIRouter

router = APIRouter(prefix="/kpi", tags=["KPI"])

@router.get("/")
def kpi():

    return {

        "supplier_reliability":94.2,

        "delivery_success":97.5,

        "procurement_confidence":96.8,

        "inventory_health":"Healthy",

        "risk":"Low"

    }