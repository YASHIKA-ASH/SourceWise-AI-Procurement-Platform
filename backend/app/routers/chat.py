from fastapi import APIRouter
from fastapi.params import Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.rag_service import answer_question

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)
current_user=Depends(get_current_user)

class ChatRequest(BaseModel):
    question: str


@router.post("/")
def chat(data: ChatRequest):

    return answer_question(data.question)