from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .cache import cache
from .cache_middleware import CacheInvalidationMiddleware
from .config import settings
from .database import Base, SessionLocal, engine
from .dependencies import enforce_procurement_rbac
from .models_enterprise import AuditEvent, ProcurementDocument, RefreshToken, User  # noqa: F401
from .observability import RequestObservabilityMiddleware, configure_logging
from .routers import admin, ai, analysis, auth, health, products, storage, suppliers, users
from .seed import seed_database
from .services.auth_service import bootstrap_initial_admin

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if settings.seed_demo_data:
            seed_database(db)
        bootstrap_initial_admin(db)
    yield
    cache.close()


app = FastAPI(
    title=settings.app_name,
    version="0.4.0",
    description=(
        "BOM, supplier scoring, landed-cost, scenario analysis, Gemini RAG, JWT RBAC, "
        "Redis caching, S3 document storage, and CloudWatch-ready observability."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(CacheInvalidationMiddleware)
app.add_middleware(RequestObservabilityMiddleware)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(storage.router)

protected = [Depends(enforce_procurement_rbac)]
app.include_router(products.router, dependencies=protected)
app.include_router(suppliers.router, dependencies=protected)
app.include_router(analysis.router, dependencies=protected)
app.include_router(ai.router, dependencies=protected)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "status": "running",
        "version": "0.4.0",
        "environment": settings.environment,
    }
