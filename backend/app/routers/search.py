from fastapi import APIRouter, Depends

from pydantic import BaseModel
from app.dependencies import get_current_user
from app.rag.vectordb import search

router = APIRouter(tags=["Search"])

current_user=Depends(get_current_user)

class Query(BaseModel):
    question: str


@router.post("/search")

def semantic_search(data: Query):

    results = search(data.question)

    return results