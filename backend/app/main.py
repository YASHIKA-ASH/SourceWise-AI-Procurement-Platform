from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from app.decision_engine import evaluate

from sqlalchemy.orm import Session
from fastapi import Depends
from app.database.database import get_db
from app.decision_engine import evaluate
from app.routers.supplier import router as supplier_router
from app.routers.upload import router as upload_router
from app.routers.supplier import router as suppliers_router
app = FastAPI(title="SourceWise")


app.include_router(supplier_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload_router)

class Procurement(BaseModel):
    quantity: int
    inventory: int
    daily_usage: int


@app.get("/")
def home():
    return {"project": "SourceWise"}


@app.post("/simulate")
def simulate(data: Procurement, db: Session = Depends(get_db)):

    result = evaluate(
        db,
        data.quantity,
        data.inventory,
        data.daily_usage
    )

    return {
        "best_supplier": result[0],
        "comparison": result
    }