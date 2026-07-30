from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import BOMComponent, Supplier, SupplierOffer
from ..schemas import (
    OfferCreate,
    OfferRead,
    OfferUpdate,
    SupplierCreate,
    SupplierRead,
    SupplierUpdate,
)

router = APIRouter(tags=["Suppliers"])


@router.get("/suppliers", response_model=list[SupplierRead])
def list_suppliers(db: Session = Depends(get_db)):
    return db.scalars(select(Supplier).order_by(Supplier.name)).all()


@router.post("/suppliers", response_model=SupplierRead, status_code=201)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Supplier).where(Supplier.name == payload.name)):
        raise HTTPException(status_code=409, detail="A supplier with this name already exists")
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierRead)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    values = payload.model_dump(exclude_unset=True)
    if "name" in values:
        duplicate = db.scalar(
            select(Supplier).where(Supplier.name == values["name"], Supplier.id != supplier_id)
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="A supplier with this name already exists")
    for key, value in values.items():
        setattr(supplier, key, value)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    has_offers = db.scalar(select(SupplierOffer.id).where(SupplierOffer.supplier_id == supplier_id).limit(1))
    if has_offers:
        raise HTTPException(status_code=409, detail="Delete this supplier's offers before deleting the supplier")
    db.delete(supplier)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/components/{component_id}/offers", response_model=list[OfferRead])
def list_component_offers(component_id: int, db: Session = Depends(get_db)):
    if not db.get(BOMComponent, component_id):
        raise HTTPException(status_code=404, detail="Component not found")
    offers = db.scalars(
        select(SupplierOffer)
        .where(SupplierOffer.component_id == component_id)
        .options(selectinload(SupplierOffer.supplier))
        .order_by(SupplierOffer.unit_price)
    ).all()
    return [
        OfferRead(
            id=offer.id,
            component_id=offer.component_id,
            supplier_name=offer.supplier.name,
            supplier_id=offer.supplier_id,
            unit_price=offer.unit_price,
            transportation_cost_per_unit=offer.transportation_cost_per_unit,
            customs_import_duty_percentage=offer.customs_import_duty_percentage,
            packaging_cost_per_unit=offer.packaging_cost_per_unit,
            warehousing_cost_per_unit=offer.warehousing_cost_per_unit,
            tax_percentage=offer.tax_percentage,
            delay_related_cost_per_unit=offer.delay_related_cost_per_unit,
            lead_time_days=offer.lead_time_days,
            minimum_order_quantity=offer.minimum_order_quantity,
        )
        for offer in offers
    ]


@router.post("/components/{component_id}/offers", response_model=OfferRead, status_code=201)
def create_offer(component_id: int, payload: OfferCreate, db: Session = Depends(get_db)):
    if not db.get(BOMComponent, component_id):
        raise HTTPException(status_code=404, detail="Component not found")
    supplier = db.get(Supplier, payload.supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    duplicate = db.scalar(
        select(SupplierOffer).where(
            SupplierOffer.component_id == component_id,
            SupplierOffer.supplier_id == payload.supplier_id,
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This supplier already has an offer for the selected component. Edit the existing offer instead.",
        )
    offer = SupplierOffer(component_id=component_id, **payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return OfferRead(
        id=offer.id,
        component_id=component_id,
        supplier_name=supplier.name,
        **payload.model_dump(),
    )


@router.patch("/offers/{offer_id}", response_model=OfferRead)
def update_offer(offer_id: int, payload: OfferUpdate, db: Session = Depends(get_db)):
    offer = db.get(SupplierOffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    values = payload.model_dump(exclude_unset=True)
    if "supplier_id" in values and not db.get(Supplier, values["supplier_id"]):
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in values.items():
        setattr(offer, key, value)
    db.commit()
    db.refresh(offer)
    supplier = db.get(Supplier, offer.supplier_id)
    return OfferRead(
        id=offer.id,
        component_id=offer.component_id,
        supplier_name=supplier.name if supplier else None,
        supplier_id=offer.supplier_id,
        unit_price=offer.unit_price,
        transportation_cost_per_unit=offer.transportation_cost_per_unit,
        customs_import_duty_percentage=offer.customs_import_duty_percentage,
        packaging_cost_per_unit=offer.packaging_cost_per_unit,
        warehousing_cost_per_unit=offer.warehousing_cost_per_unit,
        tax_percentage=offer.tax_percentage,
        delay_related_cost_per_unit=offer.delay_related_cost_per_unit,
        lead_time_days=offer.lead_time_days,
        minimum_order_quantity=offer.minimum_order_quantity,
    )


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.get(SupplierOffer, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    db.delete(offer)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
