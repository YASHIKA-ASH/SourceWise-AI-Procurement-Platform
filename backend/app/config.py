from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Application configuration loaded from backend/.env and process variables."""

    app_name: str = "SourceWise Procurement Intelligence API"
    environment: str = "development"
    log_level: str = "INFO"
    log_file: str = str(BACKEND_DIR / "logs" / "app.log")
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    seed_demo_data: bool = True

    database_url: str = f"sqlite:///{BACKEND_DIR / 'procurement.db'}"
    database_pool_size: int = Field(default=5, ge=1, le=50)
    database_max_overflow: int = Field(default=10, ge=0, le=100)

    jwt_secret_key: str = "development-only-change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=5, le=1440)
    refresh_token_expire_days: int = Field(default=7, ge=1, le=90)
    initial_admin_email: str | None = None
    initial_admin_password: str | None = None
    initial_admin_name: str = "SourceWise Administrator"

    redis_url: str | None = "redis://localhost:6379/0"
    cache_ttl_seconds: int = Field(default=300, ge=10, le=86400)
    redis_socket_timeout_seconds: float = Field(default=1.5, ge=0.1, le=30)

    aws_region: str = "ap-south-1"
    s3_bucket_name: str | None = None
    s3_key_prefix: str = "sourcewise"
    s3_presigned_expiry_seconds: int = Field(default=900, ge=60, le=3600)
    s3_sse_algorithm: str = "AES256"
    s3_max_upload_bytes: int = Field(default=52_428_800, ge=1_048_576)

    gemini_api_key: str | None = None
    google_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash-lite"
    chroma_path: str = str(BACKEND_DIR / "chroma_db")

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8-sig",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        value = value.strip().strip('"').strip("'")
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value

    @field_validator("environment")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.strip().lower()

    @model_validator(mode="after")
    def validate_production_secrets(self):
        insecure_markers = ("development", "change-this", "replace-with")
        if self.environment == "production" and (
            len(self.jwt_secret_key) < 32
            or any(marker in self.jwt_secret_key.lower() for marker in insecure_markers)
        ):
            raise ValueError("JWT_SECRET_KEY must contain at least 32 random characters in production")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]

    @property
    def s3_enabled(self) -> bool:
        return bool(self.s3_bucket_name)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
