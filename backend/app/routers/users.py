from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth_schemas import UserCreate, UserRead, UserUpdate
from ..database import get_db
from ..dependencies import require_roles
from ..models_enterprise import User
from ..security import hash_password
from ..services.auth_service import normalize_email

router = APIRouter(
    prefix="/users",
    tags=["User Administration"],
    dependencies=[Depends(require_roles("admin"))],
)


@router.get("", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.email)).all()


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    email = normalize_email(str(payload.email))
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    values = payload.model_dump(exclude_unset=True)
    if _would_remove_last_admin(user, values, db):
        raise HTTPException(status_code=409, detail="At least one active administrator is required")

    if "password" in values:
        user.hashed_password = hash_password(values.pop("password"))
    for key, value in values.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def _would_remove_last_admin(user: User, values: dict, db: Session) -> bool:
    if user.role != "admin" or not user.is_active:
        return False
    becoming_non_admin = values.get("role", user.role) != "admin"
    becoming_inactive = values.get("is_active", user.is_active) is False
    if not (becoming_non_admin or becoming_inactive):
        return False
    active_admins = db.scalar(
        select(func.count()).select_from(User).where(User.role == "admin", User.is_active.is_(True))
    ) or 0
    return active_admins <= 1
