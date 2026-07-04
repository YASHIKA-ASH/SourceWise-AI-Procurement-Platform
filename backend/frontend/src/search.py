from fastapi import APIRouter
from app.decision_engine import SUPPLIERS

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/{material}")
def search_supplier(material: str):
    return [
        s for s in SUPPLIERS
        if material.lower() in s["name"].lower()
    ]