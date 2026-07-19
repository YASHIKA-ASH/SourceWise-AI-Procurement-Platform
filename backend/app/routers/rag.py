from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.rag_service import answer_question

router = APIRouter(
    prefix="/rag",
    tags=["RAG"]
)
current_user=Depends(get_current_user)

class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
def chat(request: ChatRequest):

    return answer_question(
        request.question
    )