from sqlalchemy.orm import Session

from app.models.user import User
from app.security import hash_password


def get_user_by_username(
    db: Session,
    username: str
):
    return (
        db.query(User)
        .filter(User.username == username)
        .first()
    )


def create_user(
    db: Session,
    data
):

    existing_user = get_user_by_username(
        db,
        data.username
    )

    if existing_user:
        return None

    user = User(
        username=data.username,
        password=hash_password(data.password),
        role=data.role
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user