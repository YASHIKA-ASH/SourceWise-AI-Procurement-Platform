from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.routers.analytics import router as analytics_router
from app.routers.report import router as report_router
from app.decision_engine import evaluate
from app.services.insights import generate_insights
from sqlalchemy.orm import Session
from fastapi import Depends
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.database.database import get_db
from app.routers.supplier import router as supplier_router
from app.routers.upload import router as upload_router
from app.routers.ranking import router as ranking_router
#from app.models import metrics
import os
from app.routers.copilot import router as copilot_router
from app.rag.indexer import build_indexes
from app.middleware.timing import TimingMiddleware
from app.database.database import engine
from app.database.database import Base
from app.routers.metrics import router as metrics_router
from fastapi import Request
from app.routers import cost_optimizer
from app.routers import risk
from app.routers.redis import router as redis_router
from app.routers.rag import router as rag_router
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
import json
from app.database.database import SessionLocal
from app.models.supplier import Supplier
from app.database.redis import redis_client
from time import perf_counter
from app.routers.user import router as user_router
app = FastAPI(title="SourceWise")

@app.on_event("startup")
def startup_event():

    print("STEP 1")

    db = SessionLocal()

    print("STEP 2")

    try:
        print("STEP 3")

        suppliers = db.query(Supplier).all()

        print(f"STEP 4 - Loaded {len(suppliers)} suppliers")

    finally:
        db.close()

    print("STEP 5")


app.include_router(copilot_router)
app.add_middleware(TimingMiddleware)
app.include_router(analytics_router)
app.include_router(report_router)
app.include_router(supplier_router)
app.include_router(ranking_router)
app.include_router(metrics_router)
app.include_router(rag_router)
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(dashboard_router)
app.include_router(risk.router)
app.include_router(cost_optimizer.router)
app.include_router(auth_router)
app.include_router(user_router)
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

if os.getenv("RENDER") is None:
    Base.metadata.create_all(bind=engine)

class Procurement(BaseModel):
    quantity: int
    inventory: int
    daily_usage: int



@app.get("/")
def home():
    return {"project": "SourceWise"}





@app.post("/simulate")
def simulate(
    request: Request,
    data: Procurement,
    db: Session = Depends(get_db)
):

    start = perf_counter()

    cache_key = (
        f"simulation:"
        f"{data.quantity}:"
        f"{data.inventory}:"
        f"{data.daily_usage}"
    )

    cached = redis_client.get(cache_key)

    if cached:

        if cached:

            print("========== REDIS ==========")
            print("Module    : Simulation Cache")
            print("Cache Hit : YES")
            print("===========================")

        request.state.cache_hit = True

        total_time = perf_counter() - start

        print(f"API Time: {total_time:.3f} sec")

        request.state.api_time = total_time

        return json.loads(cached)

        print("========== REDIS ==========")
        print("Module    : Simulation Cache")
        print("Cache Hit : NO")
        print("===========================")

    request.state.cache_hit = False

    evaluation = evaluate(
        db,
        data.quantity,
        data.inventory,
        data.daily_usage
    )

    result = evaluation["results"]
    sql_time = evaluation["sql_time"]
    cache_hit = evaluation["cache_hit"]

    request.state.sql_time = sql_time
    request.state.cache_hit = cache_hit

    response = {
        "best_supplier": result[0],
        "comparison": result,
        "stockout_days": round(
            data.inventory / data.daily_usage,
            2
        ),
        "ai_insights": generate_insights(result[0])
    }

    redis_client.setex(
        cache_key,
        300,
        json.dumps(response)
    )

    total_time = perf_counter() - start

    print(f"API Time: {total_time:.3f} sec")

    request.state.api_time = total_time

    return response