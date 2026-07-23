from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.copilot import ask_copilot

router = APIRouter(
    prefix="/search",
    tags=["AI Search"]
)


class SearchRequest(BaseModel):
    query: str


@router.post("/")
def search(data: SearchRequest):

    prompt = f"""
Answer only procurement related questions.

Question:
{data.query}
"""

    answer = ask_copilot(prompt)

    return {
        "query": data.query,
        "answer": answer
    }