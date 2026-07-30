from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_active_user, require_roles
from ..models import Product
from ..models_enterprise import ProcurementDocument, User
from ..services.s3_storage import s3_storage
from ..storage_schemas import (
    CompleteUploadRequest,
    DocumentRead,
    PresignUploadRequest,
    PresignUploadResponse,
)

router = APIRouter(prefix="/files", tags=["S3 Procurement Documents"])


@router.post(
    "/presign-upload",
    response_model=PresignUploadResponse,
    dependencies=[Depends(require_roles("manager", "admin"))],
)
def create_upload(payload: PresignUploadRequest, db: Session = Depends(get_db)):
    _validate_product(payload.product_id, db)
    try:
        return s3_storage.presign_upload(**payload.model_dump())
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post(
    "/complete",
    response_model=DocumentRead,
    status_code=201,
    dependencies=[Depends(require_roles("manager", "admin"))],
)
def complete_upload(
    payload: CompleteUploadRequest,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    _validate_product(payload.product_id, db)
    if not payload.object_key.startswith(f"{settings.s3_key_prefix}/{settings.environment}/"):
        raise HTTPException(status_code=400, detail="Object key is outside the SourceWise prefix")
    try:
        metadata = s3_storage.head(payload.object_key)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    document = ProcurementDocument(
        product_id=payload.product_id,
        uploaded_by_id=user.id,
        filename=payload.filename,
        content_type=metadata.get("ContentType") or payload.content_type,
        size_bytes=int(metadata.get("ContentLength") or 0),
        bucket_name=settings.s3_bucket_name or "",
        object_key=payload.object_key,
        checksum_sha256=payload.checksum_sha256,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentRead])
def list_documents(
    product_id: int | None = Query(default=None),
    _: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = select(ProcurementDocument).order_by(ProcurementDocument.created_at.desc())
    if product_id is not None:
        query = query.where(ProcurementDocument.product_id == product_id)
    return db.scalars(query).all()


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    _: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    document = db.get(ProcurementDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        url = s3_storage.presign_download(document.object_key)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"download_url": url, "expires_in": settings.s3_presigned_expiry_seconds}


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("manager", "admin"))],
)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.get(ProcurementDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        s3_storage.delete(document.object_key)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    db.delete(document)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _validate_product(product_id: int | None, db: Session) -> None:
    if product_id is not None and not db.get(Product, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
