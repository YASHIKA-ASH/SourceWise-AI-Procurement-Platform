from fastapi import APIRouter

from pydantic import BaseModel

from app.rag.vectordb import search

router = APIRouter(tags=["Search"])


class Query(BaseModel):
    question: str


@router.post("/search")

def semantic_search(data: Query):

    results = search(data.question)

    return results