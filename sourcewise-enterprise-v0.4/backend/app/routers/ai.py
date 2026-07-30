from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import BOMComponent, EnterpriseSettings, Product, Supplier, SupplierOffer
from ..schemas import CopilotQuestion
from ..services.ai_copilot import (
    ProcurementVectorStore,
    answer_question,
    build_procurement_knowledge,
    llm_status,
)
from ..services.procurement import product_recommendation

router = APIRouter(prefix="/ai", tags=["AI Copilot"])
VALID_STRATEGIES = {"balanced", "lowest_cost", "lowest_risk", "fastest_delivery"}


@router.get("/status")
def ai_status():
    status = llm_status()
    try:
        store = ProcurementVectorStore()
        chroma_ready = True
        chroma_path = str(store.path)
        error = None
    except Exception as exc:  # pragma: no cover - installation/configuration path
        chroma_ready = False
        chroma_path = None
        error = str(exc)
    return {**status, "chroma_ready": chroma_ready, "chroma_path": chroma_path, "error": error}


@router.post("/products/{product_id}/index")
def index_product_knowledge(
    product_id: int,
    strategy: str = Query(default="balanced"),
    db: Session = Depends(get_db),
):
    product, settings, suppliers, recommendation = _live_context(product_id, strategy, db)
    chunks = build_procurement_knowledge(product, settings, recommendation, suppliers)
    store = ProcurementVectorStore()
    count = store.replace_product_index(product_id, chunks)
    return {
        "product_id": product_id,
        "strategy": strategy,
        "indexed_chunks": count,
        "chroma_path": str(store.path),
        "message": "Live procurement data indexed successfully.",
    }


@router.post("/products/{product_id}/ask")
def ask_copilot(product_id: int, payload: CopilotQuestion, db: Session = Depends(get_db)):
    product, settings, suppliers, recommendation = _live_context(product_id, payload.strategy, db)
    chunks = build_procurement_knowledge(product, settings, recommendation, suppliers)
    store = ProcurementVectorStore()
    indexed_chunks = store.replace_product_index(product_id, chunks)
    sources = store.search(product_id, payload.question, payload.top_k)
    answer, llm_used = answer_question(payload.question, sources, payload.strategy)
    status = llm_status()
    return {
        "question": payload.question,
        "answer": answer,
        "product_id": product_id,
        "product_name": product.name,
        "strategy": payload.strategy,
        "indexed_chunks": indexed_chunks,
        "retrieved_chunks": len(sources),
        "llm_used": llm_used,
        "provider": status["provider"],
        "model": status["model"] if llm_used else None,
        "sources": sources,
    }


def _live_context(product_id: int, strategy: str, db: Session):
    if strategy not in VALID_STRATEGIES:
        raise HTTPException(status_code=400, detail=f"Strategy must be one of {sorted(VALID_STRATEGIES)}")
    product = db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.components)
            .selectinload(BOMComponent.offers)
            .selectinload(SupplierOffer.supplier)
        )
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    settings = db.scalar(select(EnterpriseSettings).limit(1))
    if not settings:
        settings = EnterpriseSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    suppliers = db.scalars(
        select(Supplier)
        .options(selectinload(Supplier.offers).selectinload(SupplierOffer.component))
        .order_by(Supplier.name)
    ).all()
    recommendation = product_recommendation(product, settings, strategy=strategy)
    return product, settings, suppliers, recommendation
