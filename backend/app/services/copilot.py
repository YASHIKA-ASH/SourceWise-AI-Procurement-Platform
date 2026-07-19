import json
from time import perf_counter

from app.database.redis import redis_client
from app.models.supplier import Supplier
from app.rag.llm import client
from app.services.rag_service import answer_question
from app.utils.risk_calculator import calculate_risk
from app.utils.explainability import generate_explanation

def procurement_copilot(db, question):

    cache_key = f"copilot:{question.lower().strip()}"

    cached = redis_client.get(cache_key)

    if cached:
        print("✅ Copilot Cache Hit")
        return json.loads(cached)

    suppliers = db.query(Supplier).all()

    supplier_summary = []

    for s in suppliers:

        score = (
            (100 - s.price_per_unit * 2)
            + (100 - s.lead_time * 3)
            + (s.quality_score * 10)
            + (s.on_time_delivery * 10)
            + (s.supplier_rating * 10)
            + (s.sustainability_score * 5)
            - (s.defect_rate * 20)
        ) / 6

        risk = calculate_risk(s)

        supplier_summary.append({
            "name": s.name,
            "material": s.material,
            "price_per_unit": s.price_per_unit,
            "lead_time": s.lead_time,
            "quality_score": s.quality_score,
            "on_time_delivery": s.on_time_delivery,
            "defect_rate": s.defect_rate,
            "supplier_rating": s.supplier_rating,
            "sustainability_score": s.sustainability_score,
            "country": s.country,
            "score": round(score, 2),
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "risk_reasons": risk["reasons"]
        })

    supplier_summary = sorted(
        supplier_summary,
        key=lambda x: x["score"],
        reverse=True
    )

    rag_response = answer_question(question)

    prompt = f"""
You are an AI Procurement Copilot.

Supplier Database (already ranked by overall procurement score):

{supplier_summary}

Each supplier also contains:
- risk_score (0-100)
- risk_level (Low, Medium, High)
- risk_reasons

Overall supplier score considers:
- Lower price
- Lower lead time
- Higher quality score
- Higher on-time delivery
- Higher supplier rating
- Higher sustainability
- Lower defect rate

While recommending a supplier, consider BOTH:
1. Overall procurement score
2. Supplier risk score

Prefer suppliers with high procurement score and low risk unless the user's question specifies otherwise.

Contract Analysis:

{rag_response["answer"]}

User Question:

{question}

Return ONLY valid JSON.

{{
    "recommended_supplier":"",
    "confidence":0,
    "summary":"",
    "advantages":[],
    "risks":[],
    "contract_reference":"",
    "next_action":""
}}
"""

    start = perf_counter()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    copilot_time = perf_counter() - start

    try:
        recommendation = json.loads(response.text)
    except Exception:
        recommendation = {
            "raw_response": response.text
        }

    result = {
        "recommendation": recommendation,
        "top_suppliers": supplier_summary[:3],
        "sources": rag_response["sources"],
        "copilot_time": round(copilot_time, 3)
    }

    redis_client.setex(
        cache_key,
        3600,
        json.dumps(result)
    )

    return result