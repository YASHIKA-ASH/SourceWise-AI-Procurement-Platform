from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..models_enterprise import RefreshToken, User
from ..security import create_token, hash_password, hash_token_identifier

logger = logging.getLogger("sourcewise.auth")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def issue_token_pair(
    db: Session,
    user: User,
    *,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[str, str, int]:
    access_token, _, access_expires = create_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        token_type="access",
    )
    refresh_token, refresh_jti, refresh_expires = create_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        token_type="refresh",
    )
    db.add(
        RefreshToken(
            user_id=user.id,
            jti_hash=hash_token_identifier(refresh_jti),
            expires_at=refresh_expires,
            user_agent=(user_agent or "")[:500] or None,
            ip_address=(ip_address or "")[:64] or None,
        )
    )
    db.commit()
    seconds = max(int((access_expires - datetime.now(timezone.utc)).total_seconds()), 0)
    return access_token, refresh_token, seconds


def bootstrap_initial_admin(db: Session) -> User | None:
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    if user_count:
        return None
    if not settings.initial_admin_email or not settings.initial_admin_password:
        logger.warning(
            "No users exist. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in backend/.env, then restart."
        )
        return None
    admin = User(
        email=normalize_email(settings.initial_admin_email),
        full_name=settings.initial_admin_name,
        hashed_password=hash_password(settings.initial_admin_password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    logger.info("Initial SourceWise administrator created: %s", admin.email)
    return admin
