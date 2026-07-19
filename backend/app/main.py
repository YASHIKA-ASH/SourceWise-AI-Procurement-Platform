import os

from fastapi import FastAPI
from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.database import (
    Base,
    SessionLocal,
    engine
)

from app.models.supplier import Supplier
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi import Depends
# from fastapi import Request

# from app.routers.analytics import router as analytics_router
# from app.routers.report import router as report_router
# from app.routers.auth import router as auth_router
# from app.routers.dashboard import router as dashboard_router
# from app.routers.supplier import router as supplier_router
# from app.routers.upload import router as upload_router
# from app.routers.ranking import router as ranking_router
# from app.routers.metrics import router as metrics_router
# from app.routers.copilot import router as copilot_router
# from app.routers.user import router as user_router
# from app.routers.redis import router as redis_router
# from app.routers.rag import router as rag_router
# from app.routers.search import router as search_router
# from app.routers.chat import router as chat_router

# from app.routers import risk
# from app.routers import cost_optimizer

# from app.decision_engine import evaluate
# from app.services.insights import generate_insights
# from app.middleware.timing import TimingMiddleware

# from app.database.database import get_db
# from app.database.redis import redis_client

# from app.rag.indexer import build_indexes

# from time import perf_counter
# import json

print("========== MAIN START ==========")

app = FastAPI(title="SourceWise")

print("FastAPI app created")


@app.on_event("startup")
def startup_event():

    print("========== STARTUP ==========")

    db = SessionLocal()

    print("Database session created")

    try:
        suppliers = db.query(Supplier).all()
        print(f"Loaded {len(suppliers)} suppliers")

    except Exception as e:
        print("Database startup error:")
        print(e)
        raise

    finally:
        db.close()
        print("Database session closed")

    print("========== STARTUP COMPLETE ==========")


print("Checking database initialization...")

if os.getenv("RENDER") is None:
    print("Running Base.metadata.create_all()")
    Base.metadata.create_all(bind=engine)
    print("Database tables checked")
else:
    print("Skipping create_all() on Render")


print("Registering routers...")

# app.include_router(copilot_router)
# app.include_router(analytics_router)
# app.include_router(report_router)
# app.include_router(supplier_router)
# app.include_router(ranking_router)
# app.include_router(metrics_router)
# app.include_router(rag_router)
# app.include_router(search_router)
# app.include_router(chat_router)
# app.include_router(dashboard_router)
# app.include_router(risk.router)
# app.include_router(cost_optimizer.router)
# app.include_router(auth_router)
# app.include_router(user_router)
# app.include_router(upload_router)

print("Routers registered")


class Procurement(BaseModel):
    quantity: int
    inventory: int
    daily_usage: int


@app.get("/")
def home():
    return {"project": "SourceWise"}


print("========== MAIN COMPLETE ==========")

