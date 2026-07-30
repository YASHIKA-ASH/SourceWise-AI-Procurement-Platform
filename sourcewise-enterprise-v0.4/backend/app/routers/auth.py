from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth_schemas import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse, UserRead
from ..cache import cache
from ..database import get_db
from ..dependencies import get_current_active_user
from ..models_enterprise import RefreshToken, User
from ..security import decode_token, hash_token_identifier, oauth2_scheme, verify_password
from ..services.auth_service import issue_token_pair, normalize_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/status")
def auth_status(db: Session = Depends(get_db)):
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    return {"configured": user_count > 0, "user_count": user_count}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    email = normalize_email(str(payload.email))
    client_ip = request.client.host if request.client else "unknown"
    if cache.rate_limit_exceeded(f"login:{client_ip}:{email}", limit=10, window_seconds=900):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.last_login_at = datetime.now(timezone.utc)
    access_token, refresh_token, expires_in = issue_token_pair(
        db,
        user,
        user_agent=request.headers.get("user-agent"),
        ip_address=client_ip,
    )
    db.refresh(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    record = db.scalar(
        select(RefreshToken).where(
            RefreshToken.jti_hash == hash_token_identifier(token_payload["jti"])
        )
    )
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at if record else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not record or record.revoked_at is not None or expires_at <= now:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked or expired")

    user = db.get(User, int(token_payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive")

    record.revoked_at = now
    db.commit()
    access_token, refresh_token, expires_in = issue_token_pair(
        db,
        user,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.refresh(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=user,
    )


@router.post("/logout", status_code=204)
def logout(
    payload: LogoutRequest,
    token: str = Depends(oauth2_scheme),
    _: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    try:
        access_payload = decode_token(token, expected_type="access")
        ttl = max(int(access_payload["exp"] - now.timestamp()), 0)
        cache.revoke_access_token(access_payload["jti"], ttl)
    except ValueError:
        pass

    if payload.refresh_token:
        try:
            refresh_payload = decode_token(payload.refresh_token, expected_type="refresh")
            record = db.scalar(
                select(RefreshToken).where(
                    RefreshToken.jti_hash == hash_token_identifier(refresh_payload["jti"])
                )
            )
            if record and record.revoked_at is None:
                record.revoked_at = now
                db.commit()
        except ValueError:
            pass
    return None


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_active_user)):
    return user
