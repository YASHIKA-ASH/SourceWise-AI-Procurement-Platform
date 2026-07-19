from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return payload


def require_admin(
    user=Depends(get_current_user)
):

    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user


def require_manager(
    user=Depends(get_current_user)
):

    if user["role"] not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )

    return user


def require_supplier(
    user=Depends(get_current_user)
):

    if user["role"] not in [
        "admin",
        "supplier"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier access required"
        )

    return user
