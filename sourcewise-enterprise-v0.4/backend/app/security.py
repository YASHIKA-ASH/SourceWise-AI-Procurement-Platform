from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from .config import settings

password_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bool(password_hasher.verify(hashed_password, password))
    except (VerifyMismatchError, InvalidHashError):
        return False


def hash_token_identifier(jti: str) -> str:
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()


def create_token(*, user_id: int, email: str, role: str, token_type: str) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    if token_type == "access":
        expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    elif token_type == "refresh":
        expires_at = now + timedelta(days=settings.refresh_token_expire_days)
    else:
        raise ValueError("Unsupported token type")

    jti = str(uuid.uuid4())
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "type": token_type,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "iss": "sourcewise",
        "aud": "sourcewise-api",
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, expires_at


def decode_token(token: str, *, expected_type: str | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            audience="sourcewise-api",
            issuer="sourcewise",
        )
    except InvalidTokenError as exc:
        raise ValueError("Invalid or expired token") from exc

    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise ValueError(f"Expected a {expected_type} token")
    if not payload.get("sub") or not payload.get("jti"):
        raise ValueError("Token is missing required claims")
    return payload
