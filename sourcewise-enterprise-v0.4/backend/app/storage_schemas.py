from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PresignUploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=160)
    size_bytes: int = Field(gt=0)
    product_id: int | None = None


class PresignUploadResponse(BaseModel):
    object_key: str
    upload_url: str
    fields: dict[str, str]
    expires_in: int


class CompleteUploadRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=1024)
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=160)
    product_id: int | None = None
    checksum_sha256: str | None = Field(default=None, min_length=64, max_length=64)


class DocumentRead(BaseModel):
    id: int
    product_id: int | None
    uploaded_by_id: int
    filename: str
    content_type: str
    size_bytes: int
    bucket_name: str
    object_key: str
    checksum_sha256: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
