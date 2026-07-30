from __future__ import annotations

from sqlalchemy import inspect, text

from app.cache import cache
from app.config import settings
from app.database import engine
from app.services.ai_copilot import llm_status
from app.services.s3_storage import s3_storage


def masked(value: str | None) -> str:
    if not value:
        return "not configured"
    return f"configured ({len(value)} characters)"


print("Environment:", settings.environment)
print("Database backend:", engine.url.get_backend_name())
print("Database driver:", engine.url.get_driver_name())
print("Database host:", engine.url.host or "local")
with engine.connect() as connection:
    print("Database SELECT 1:", connection.execute(text("SELECT 1")).scalar())
print("Tables:", ", ".join(sorted(inspect(engine).get_table_names())))
print("JWT secret:", masked(settings.jwt_secret_key))
print("Initial admin email:", settings.initial_admin_email or "not configured")
print("Redis configured:", bool(settings.redis_url))
print("Redis available:", cache.ping() if settings.redis_url else None)
print("S3 bucket:", settings.s3_bucket_name or "not configured")
print("S3 available:", s3_storage.health() if settings.s3_enabled else None)
print("Gemini:", llm_status())
