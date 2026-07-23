from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.copilot import ask_copilot

router = APIRouter(
    prefix="/copilot",
    tags=["AI Copilot"]
)


class CopilotRequest(BaseModel):
    question: str


@router.post("/")
def copilot(data: CopilotRequest):

    answer = ask_copilot(data.question)

    return {
        "answer": answer
    }