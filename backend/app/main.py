from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.routers.analytics import router as analytics_router
from app.routers.report import router as report_router
from app.decision_engine import evaluate
from app.services.insights import generate_insights
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database.database import get_db
from app.decision_engine import evaluate
from app.routers.supplier import router as supplier_router
from app.routers.upload import router as upload_router
from app.routers.supplier import router as suppliers_router
from app.routers.ranking import router as ranking_router
from app.models import supplier
#from app.models import metrics
from app.middleware.timing import TimingMiddleware
from app.models.performance_log import PerformanceLog
from app.database.database import engine
from app.database.database import Base
from app.routers.metrics import router as metrics_router


app = FastAPI(title="SourceWise")
Base.metadata.create_all(bind=engine)
app.add_middleware(TimingMiddleware)
app.include_router(analytics_router)
app.include_router(report_router)
app.include_router(supplier_router)
app.include_router(ranking_router)
app.include_router(metrics_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://source-wise-ai-procurement-platform-fawn.vercel.app"
],
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
    "comparison": result,
    "ai_insights": generate_insights(result[0])
    }

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
    "comparison": result,
    "stockout_days": round(data.inventory/data.daily_usage,2)
    }