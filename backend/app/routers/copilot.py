from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.copilot import procurement_copilot

router = APIRouter(
    prefix="/copilot",
    tags=["AI Procurement Copilot"]
)


class CopilotRequest(BaseModel):
    question: str


@router.post("/")
def copilot(
    data: CopilotRequest,
    db: Session = Depends(get_db)
):

    return procurement_copilot(
        db,
        data.question
    )