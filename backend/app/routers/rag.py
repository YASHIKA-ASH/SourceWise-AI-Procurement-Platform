from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.copilot import ask_copilot

router = APIRouter(
    prefix="/rag",
    tags=["RAG Chat"]
)


class RagRequest(BaseModel):
    question: str


@router.post("/chat")
def rag_chat(data: RagRequest):

    prompt = f"""
You are SourceWise AI.

Answer using procurement knowledge.

Question:
{data.question}

Return:
- Answer
- Confidence (0-100)
- Reasoning
"""

    answer = ask_copilot(prompt)

    return {
        "question": data.question,
        "answer": answer,
        "confidence": 92
    }