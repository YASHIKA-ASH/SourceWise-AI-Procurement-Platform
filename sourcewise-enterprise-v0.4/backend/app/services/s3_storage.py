from __future__ import annotations

import logging
import re
import uuid
from pathlib import PurePosixPath

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from ..config import settings

logger = logging.getLogger("sourcewise.s3")
SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


class S3Storage:
    def __init__(self) -> None:
        self.bucket = settings.s3_bucket_name
        self.region = settings.aws_region
        self._client = None
        if self.bucket:
            self._client = boto3.client(
                "s3",
                region_name=self.region,
                config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
            )

    @property
    def configured(self) -> bool:
        return bool(self.bucket and self._client)

    def _require_client(self):
        if not self._client or not self.bucket:
            raise RuntimeError("S3 is not configured. Set S3_BUCKET_NAME in backend/.env")
        return self._client

    def object_key(self, filename: str, product_id: int | None) -> str:
        safe_name = SAFE_FILENAME.sub("-", PurePosixPath(filename).name).strip(".-") or "document"
        scope = f"products/{product_id}" if product_id else "general"
        return f"{settings.s3_key_prefix}/{settings.environment}/{scope}/{uuid.uuid4()}-{safe_name}"

    def presign_upload(
        self,
        *,
        filename: str,
        content_type: str,
        size_bytes: int,
        product_id: int | None,
    ) -> dict:
        client = self._require_client()
        if size_bytes > settings.s3_max_upload_bytes:
            raise ValueError(f"File exceeds {settings.s3_max_upload_bytes} bytes")
        key = self.object_key(filename, product_id)
        response = client.generate_presigned_post(
            Bucket=self.bucket,
            Key=key,
            Fields={
                "Content-Type": content_type,
                "x-amz-server-side-encryption": settings.s3_sse_algorithm,
            },
            Conditions=[
                {"Content-Type": content_type},
                {"x-amz-server-side-encryption": settings.s3_sse_algorithm},
                ["content-length-range", 1, settings.s3_max_upload_bytes],
            ],
            ExpiresIn=settings.s3_presigned_expiry_seconds,
        )
        return {
            "object_key": key,
            "upload_url": response["url"],
            "fields": response["fields"],
            "expires_in": settings.s3_presigned_expiry_seconds,
        }

    def head(self, object_key: str) -> dict:
        client = self._require_client()
        try:
            return client.head_object(Bucket=self.bucket, Key=object_key)
        except (ClientError, BotoCoreError) as exc:
            raise RuntimeError("Unable to verify the uploaded S3 object") from exc

    def presign_download(self, object_key: str) -> str:
        client = self._require_client()
        try:
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=settings.s3_presigned_expiry_seconds,
            )
        except (ClientError, BotoCoreError) as exc:
            raise RuntimeError("Unable to generate the S3 download URL") from exc

    def delete(self, object_key: str) -> None:
        client = self._require_client()
        try:
            client.delete_object(Bucket=self.bucket, Key=object_key)
        except (ClientError, BotoCoreError) as exc:
            raise RuntimeError("Unable to delete the S3 object") from exc

    def health(self) -> bool:
        if not self.configured:
            return False
        try:
            self._client.head_bucket(Bucket=self.bucket)
            return True
        except (ClientError, BotoCoreError) as exc:
            logger.warning("S3 health check failed: %s", exc)
            return False


s3_storage = S3Storage()
