from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .cache import cache
from .database import get_db
from .models_enterprise import User
from .security import decode_token, oauth2_scheme

ROLE_RANK = {"viewer": 0, "analyst": 1, "manager": 2, "admin": 3}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token, expected_type="access")
        if cache.is_access_token_revoked(payload["jti"]):
            raise ValueError("Token has been revoked")
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise credentials_error

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise credentials_error
    return user


def get_current_active_user(
    request: Request,
    user: User = Depends(get_current_user),
) -> User:
    request.state.user = user
    return user


def require_roles(*roles: str) -> Callable:
    allowed = set(roles)

    def dependency(user: User = Depends(get_current_active_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return dependency


def _require_minimum_role(user: User, minimum_role: str) -> None:
    if ROLE_RANK.get(user.role, -1) < ROLE_RANK[minimum_role]:
        raise HTTPException(status_code=403, detail=f"{minimum_role.title()} role or higher is required")


def enforce_procurement_rbac(
    request: Request,
    user: User = Depends(get_current_active_user),
) -> User:
    """Central policy for the existing procurement routers.

    GET requests are available to every authenticated role. Analysts can run
    simulations and AI analysis. Managers and admins can mutate master data.
    """

    method = request.method.upper()
    path = request.url.path

    if method in {"GET", "HEAD", "OPTIONS"}:
        return user

    analyst_actions = (
        path.startswith("/analysis/products/") and path.endswith("/scenario")
    ) or path.startswith("/ai/")

    if analyst_actions:
        _require_minimum_role(user, "analyst")
    else:
        _require_minimum_role(user, "manager")
    return user
