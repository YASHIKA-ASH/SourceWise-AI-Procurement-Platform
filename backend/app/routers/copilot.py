from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.database.database import get_db
from app.services.copilot import procurement_copilot
from app.dependencies import get_current_user
current_user=Depends(get_current_user)
router = APIRouter(
    prefix="/copilot",
    tags=["AI Procurement Copilot"]
)


class CopilotRequest(BaseModel):
    question: str


@router.post("/")
def copilot(
    data: CopilotRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return procurement_copilot(
        db,
        data.question
    )