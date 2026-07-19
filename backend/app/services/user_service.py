from sqlalchemy.orm import Session

from app.models.user import User
from app.security import hash_password


def create_user(db: Session, data):

    user = User(
        username=data.username,
        password=hash_password(data.password),
        role=data.role
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user