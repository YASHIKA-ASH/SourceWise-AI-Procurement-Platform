from __future__ import annotations

import hashlib
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from ..config import settings
from ..models import EnterpriseSettings, Product, Supplier

TOKEN_PATTERN = re.compile(r"[a-z0-9][a-z0-9_.%₹-]*", re.IGNORECASE)
EMBEDDING_DIMENSION = 384
COLLECTION_VERSION = "v1"


@dataclass(slots=True)
class KnowledgeChunk:
    chunk_id: str
    title: str
    text: str
    metadata: dict[str, str | int | float | bool]


def _money(value: float | None) -> str:
    if value is None:
        return "not configured"
    return f"₹{value:,.2f}"


def build_procurement_knowledge(
    product: Product,
    settings: EnterpriseSettings,
    recommendation: dict[str, Any],
    suppliers: Iterable[Supplier],
) -> list[KnowledgeChunk]:
    """Convert live procurement data and calculated results into RAG-ready chunks."""
    chunks: list[KnowledgeChunk] = []
    summary = recommendation["summary"]

    chunks.append(
        KnowledgeChunk(
            chunk_id=f"product-{product.id}",
            title=f"Product profile: {product.name}",
            text=(
                f"Product {product.name} has SKU {product.sku}. Target manufacturing cost is "
                f"{_money(product.target_manufacturing_cost)}. Expected selling price is "
                f"{_money(product.expected_selling_price)}. Minimum profit margin is "
                f"{product.minimum_profit_margin if product.minimum_profit_margin is not None else 'not configured'}%. "
                f"Maximum procurement budget is {_money(product.maximum_procurement_budget)}. "
                f"Production duration is {product.production_days} days."
            ),
            metadata={"type": "product", "product_id": product.id, "title": f"Product profile: {product.name}"},
        )
    )

    chunks.append(
        KnowledgeChunk(
            chunk_id=f"settings-{product.id}",
            title="Enterprise scoring and mandatory filters",
            text=(
                f"Supplier scoring weights are cost {settings.cost_weight * 100:.0f}%, quality "
                f"{settings.quality_weight * 100:.0f}%, lead time {settings.lead_time_weight * 100:.0f}%, "
                f"and risk {settings.risk_weight * 100:.0f}%. Maximum lead time is "
                f"{settings.maximum_lead_time_days if settings.maximum_lead_time_days is not None else 'not set'} days. "
                f"Minimum quality rating is {settings.minimum_quality_rating if settings.minimum_quality_rating is not None else 'not set'}. "
                f"Maximum risk score is {settings.maximum_risk_score if settings.maximum_risk_score is not None else 'not set'}. "
                f"ISO certification required: {settings.require_iso_certification}. Approved suppliers only: "
                f"{settings.approved_suppliers_only}. Domestic supplier required: {settings.require_domestic_supplier}. "
                f"Maximum supplier share is {settings.maximum_supplier_share_percentage}%. MOQ enforcement: "
                f"{settings.enforce_minimum_order_quantity}."
            ),
            metadata={"type": "settings", "product_id": product.id, "title": "Enterprise scoring and mandatory filters"},
        )
    )

    chunks.append(
        KnowledgeChunk(
            chunk_id=f"summary-{product.id}-{recommendation['strategy']}",
            title=f"Calculated procurement summary ({recommendation['strategy']})",
            text=(
                f"The {recommendation['strategy']} sourcing strategy produces a final procurement cost of "
                f"{_money(summary['final_product_procurement_cost'])}. Expected production start date is "
                f"{summary['expected_production_start_date'] or 'not available'}, expected completion date is "
                f"{summary['expected_completion_date'] or 'not available'}, and the production bottleneck is "
                f"{summary['production_bottleneck'] or 'none'}. Average quality score is "
                f"{summary['average_quality_score']}/100. Average risk exposure is "
                f"{summary['average_risk_exposure']}/100. Supplier dependency is "
                f"{summary['supplier_dependency_percentage']}%. Expected profit is {_money(summary['expected_profit'])} "
                f"and expected profit margin is {summary['expected_profit_margin'] if summary['expected_profit_margin'] is not None else 'not configured'}%. "
                f"Target status is {summary['target_status']}. Maximum acceptable cost is "
                f"{_money(summary['maximum_acceptable_cost'])}; target cost variance is "
                f"{_money(summary['target_cost_variance'])}. All components fully allocated: "
                f"{summary['all_components_fully_allocated']}."
            ),
            metadata={
                "type": "recommendation_summary",
                "product_id": product.id,
                "strategy": recommendation["strategy"],
                "title": f"Calculated procurement summary ({recommendation['strategy']})",
            },
        )
    )

    component_by_id = {component.id: component for component in product.components}
    for result in recommendation["component_results"]:
        component = component_by_id.get(result["component_id"])
        component_title = f"BOM component: {result['part_name']}"
        allocation_text = "; ".join(
            (
                f"{row['supplier_name']} receives {row['allocated_quantity']:,.2f} units, landed cost "
                f"{_money(row['cost_breakdown']['total_landed_cost'])}, score {row['overall_score']}/100, "
                f"risk {row['risk_exposure']}/100, lead time {row['lead_time_days']} days, expected arrival "
                f"{row['expected_arrival_date']}, on time {row['on_time']}. Selection reason: {row['selection_reason']}"
            )
            for row in result["allocations"]
        ) or "No supplier allocation was produced."
        rejected_text = "; ".join(
            f"{row['supplier']} rejected because {', '.join(row['reasons'])}"
            for row in result.get("rejected_suppliers", [])
        ) or "No suppliers were rejected."
        inventory_text = (
            f"Gross required quantity is {result.get('gross_required_quantity', 0):,.2f}; current inventory is "
            f"{result.get('current_inventory', getattr(component, 'current_inventory', 0)):,.2f}; reserved inventory is "
            f"{result.get('reserved_inventory', getattr(component, 'reserved_inventory', 0)):,.2f}; safety stock is "
            f"{result.get('safety_stock', getattr(component, 'safety_stock', 0)):,.2f}; net purchase requirement is "
            f"{result.get('net_purchase_requirement', 0):,.2f}."
        )
        chunks.append(
            KnowledgeChunk(
                chunk_id=f"component-{result['component_id']}-{recommendation['strategy']}",
                title=component_title,
                text=(
                    f"{component_title}. Category is {result.get('category', getattr(component, 'category', 'Uncategorized'))}. "
                    f"Required delivery date is {getattr(component, 'required_delivery_date', 'not available')}. "
                    f"Critical component: {getattr(component, 'is_critical', True)}. {inventory_text} Allocation status is "
                    f"{result['status']} with shortfall {result.get('shortfall', 0):,.2f}. Recommended allocations: "
                    f"{allocation_text}. Rejected alternatives: {rejected_text}"
                ),
                metadata={
                    "type": "component",
                    "product_id": product.id,
                    "component_id": result["component_id"],
                    "title": component_title,
                },
            )
        )

        for allocation in result["allocations"]:
            cost = allocation["cost_breakdown"]
            title = f"Selected supplier {allocation['supplier_name']} for {result['part_name']}"
            chunks.append(
                KnowledgeChunk(
                    chunk_id=f"allocation-{result['component_id']}-{allocation['supplier_id']}-{recommendation['strategy']}",
                    title=title,
                    text=(
                        f"{allocation['supplier_name']} was selected for {result['part_name']} and allocated "
                        f"{allocation['allocated_quantity']:,.2f} units. Overall supplier score is "
                        f"{allocation['overall_score']}/100. Score breakdown: cost {allocation['score_breakdown']['cost']}, "
                        f"quality {allocation['score_breakdown']['quality']}, lead time {allocation['score_breakdown']['lead_time']}, "
                        f"risk desirability {allocation['score_breakdown']['risk']}. Risk exposure is "
                        f"{allocation['risk_exposure']}/100. Expected arrival is {allocation['expected_arrival_date']} versus "
                        f"required date {allocation['required_delivery_date']}; on-time status is {allocation['on_time']}. "
                        f"Landed-cost breakdown: material {_money(cost['material_cost'])}, transportation "
                        f"{_money(cost['transportation_cost'])}, customs/import duty {_money(cost['customs_import_duty'])}, "
                        f"packaging {_money(cost['packaging_cost'])}, warehousing {_money(cost['warehousing_cost'])}, taxes "
                        f"{_money(cost['taxes'])}, delay-related cost {_money(cost['delay_related_cost'])}, total "
                        f"{_money(cost['total_landed_cost'])}. {allocation['selection_reason']}"
                    ),
                    metadata={
                        "type": "allocation",
                        "product_id": product.id,
                        "component_id": result["component_id"],
                        "supplier_id": allocation["supplier_id"],
                        "title": title,
                    },
                )
            )

    for supplier in suppliers:
        linked_offers = [offer for offer in supplier.offers if offer.component and offer.component.product_id == product.id]
        offer_text = "; ".join(
            f"{offer.component.part_name}: unit price {_money(offer.unit_price)}, lead time {offer.lead_time_days} days, MOQ {offer.minimum_order_quantity}"
            for offer in linked_offers
        ) or "No quotation is registered for this product."
        title = f"Supplier profile: {supplier.name}"
        chunks.append(
            KnowledgeChunk(
                chunk_id=f"supplier-{supplier.id}-product-{product.id}",
                title=title,
                text=(
                    f"Supplier {supplier.name} is located in {supplier.country}. Domestic: {supplier.is_domestic}. "
                    f"Approved: {supplier.is_approved}. ISO certified: {supplier.iso_certified}. Quality rating: "
                    f"{supplier.quality_rating}/100. Risk score: {supplier.risk_score}/100. On-time delivery: "
                    f"{supplier.on_time_delivery_percentage}%. Average lead time: {supplier.average_lead_time_days} days. "
                    f"Defect rate: {supplier.defect_percentage}%. Fulfilment: {supplier.fulfilment_percentage}%. "
                    f"Contract compliance: {supplier.contract_compliance_percentage}%. Monthly capacity: "
                    f"{supplier.monthly_production_capacity:,.2f}; committed capacity: {supplier.current_committed_capacity:,.2f}; "
                    f"available capacity: {supplier.available_capacity:,.2f}; maximum order size: "
                    f"{supplier.maximum_order_size:,.2f}. Historical spending: {_money(supplier.historical_spending)}. "
                    f"Product quotations: {offer_text}"
                ),
                metadata={"type": "supplier", "product_id": product.id, "supplier_id": supplier.id, "title": title},
            )
        )

    return chunks


def local_embedding(text: str, dimensions: int = EMBEDDING_DIMENSION) -> list[float]:
    """Small dependency-free hashing embedding used for local RAG retrieval."""
    tokens = [token.lower() for token in TOKEN_PATTERN.findall(text)]
    features = tokens + [f"{tokens[index]}::{tokens[index + 1]}" for index in range(len(tokens) - 1)]
    vector = [0.0] * dimensions
    for feature in features:
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "big") % dimensions
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        weight = 1.35 if "::" in feature else 1.0
        vector[index] += sign * weight
    magnitude = math.sqrt(sum(value * value for value in vector))
    return [value / magnitude for value in vector] if magnitude else vector


class ProcurementVectorStore:
    def __init__(self) -> None:
        try:
            import chromadb
        except ImportError as exc:  # pragma: no cover - installation guidance path
            raise RuntimeError("ChromaDB is not installed. Run: python -m pip install -r requirements.txt") from exc
        self.path = Path(settings.chroma_path).resolve()
        self.path.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(self.path))

    def _collection(self, product_id: int):
        name = f"sourcewise_product_{product_id}_{COLLECTION_VERSION}"
        return self.client.get_or_create_collection(name=name, metadata={"app": "sourcewise", "product_id": product_id})

    def replace_product_index(self, product_id: int, chunks: list[KnowledgeChunk]) -> int:
        collection = self._collection(product_id)
        existing = collection.get(include=[]).get("ids", [])
        if existing:
            collection.delete(ids=existing)
        if not chunks:
            return 0
        collection.add(
            ids=[chunk.chunk_id for chunk in chunks],
            documents=[chunk.text for chunk in chunks],
            metadatas=[chunk.metadata for chunk in chunks],
            embeddings=[local_embedding(f"{chunk.title}. {chunk.text}") for chunk in chunks],
        )
        return len(chunks)

    def search(self, product_id: int, question: str, top_k: int = 5) -> list[dict[str, Any]]:
        collection = self._collection(product_id)
        count = collection.count()
        if count == 0:
            return []
        result = collection.query(
            query_embeddings=[local_embedding(question)],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"],
        )
        documents = (result.get("documents") or [[]])[0]
        metadatas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]
        sources: list[dict[str, Any]] = []
        for index, document in enumerate(documents):
            metadata = metadatas[index] or {}
            distance = float(distances[index]) if index < len(distances) else 0.0
            sources.append(
                {
                    "source_id": f"S{index + 1}",
                    "title": metadata.get("title", "Procurement record"),
                    "type": metadata.get("type", "record"),
                    "text": document,
                    "relevance_score": round(1 / (1 + max(distance, 0)), 4),
                    "metadata": metadata,
                }
            )
        return sources


def _gemini_api_key() -> str:
    # GEMINI_API_KEY is the recommended variable for the Gemini Developer API.
    # GOOGLE_API_KEY is also accepted by Google's SDK, so support it as a fallback.
    return (settings.gemini_api_key or "").strip() or (settings.google_api_key or "").strip()


def llm_status() -> dict[str, Any]:
    key_configured = bool(_gemini_api_key())
    return {
        "provider": "Google Gemini" if key_configured else "Retrieval-only fallback",
        "llm_configured": key_configured,
        "model": settings.gemini_model,
        "embedding_mode": "Local hashing embeddings",
    }


def answer_question(question: str, sources: list[dict[str, Any]], strategy: str) -> tuple[str, bool]:
    status = llm_status()
    evidence = "\n\n".join(
        f"[{source['source_id']}] {source['title']}\n{source['text']}" for source in sources
    )
    if not status["llm_configured"]:
        if not sources:
            return (
                "No procurement evidence was found. Add product, BOM, supplier, and quotation data, then refresh the knowledge index.",
                False,
            )
        preview = "\n\n".join(
            f"[{source['source_id']}] {source['title']}: {source['text'][:320].rstrip()}..."
            for source in sources[:3]
        )
        return (
            "The RAG search is working and retrieved the evidence below, but Gemini is not configured yet. "
            "Add GEMINI_API_KEY to backend/.env and restart the backend to receive a synthesized AI explanation.\n\n"
            + preview,
            False,
        )

    if not sources:
        return (
            "No procurement evidence was found. Add product, BOM, supplier, and quotation data, then refresh the knowledge index.",
            False,
        )

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=_gemini_api_key())
    try:
        response = client.models.generate_content(
            model=status["model"],
            contents=(
                f"Current allocation strategy: {strategy}.\n\nUser question: {question}\n\n"
                f"Retrieved procurement evidence:\n{evidence}"
            ),
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are SourceWise AI Copilot, a procurement decision-support assistant. Answer only from the "
                    "supplied procurement evidence. Explain calculations and trade-offs in plain language. Do not "
                    "invent supplier facts, prices, dates, certifications, risks, or percentages. Cite supporting "
                    "evidence inline using [S1], [S2], and so on. Clearly state when the evidence is insufficient. "
                    "Keep the answer decision-oriented and concise."
                ),
                temperature=0.2,
                max_output_tokens=900,
            ),
        )
    except Exception as exc:
        return (
            "Gemini could not generate an answer. Check that GEMINI_API_KEY is valid, the selected model is available "
            f"to your project, and your free-tier quota has not been exhausted. Technical detail: {exc}",
            False,
        )

    answer = (response.text or "").strip()
    if not answer:
        return (
            "Gemini returned an empty response. Try the question again or choose another GEMINI_MODEL in backend/.env.",
            False,
        )
    return answer, True
