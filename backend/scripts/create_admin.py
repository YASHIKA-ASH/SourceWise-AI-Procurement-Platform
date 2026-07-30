from __future__ import annotations

from getpass import getpass

from sqlalchemy import select

# Register all database models.
from app import models as procurement_models  # noqa: F401
from app import models_enterprise as enterprise_models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models_enterprise import User
from app.security import hash_password
from app.services.auth_service import normalize_email


def main() -> None:
    Base.metadata.create_all(bind=engine)

    email = normalize_email(input("Administrator email: ").strip())
    full_name = input("Administrator full name: ").strip()

    if not email or "@" not in email:
        raise SystemExit("Enter a valid email address.")

    if not full_name:
        full_name = "SourceWise Administrator"

    password = getpass("Administrator password: ")
    confirmation = getpass("Confirm password: ")

    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    if len(password) < 12:
        raise SystemExit("Password must contain at least 12 characters.")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))

        if user:
            user.full_name = full_name
            user.hashed_password = hash_password(password)
            user.role = "admin"
            user.is_active = True
            action = "updated and promoted"
        else:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True,
            )
            db.add(user)
            action = "created"

        db.commit()
        db.refresh(user)

        print()
        print(f"Administrator {action} successfully.")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"Active: {user.is_active}")


if __name__ == "__main__":
    main()
