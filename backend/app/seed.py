from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database.database import SessionLocal
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_demo_user():
    db: Session = SessionLocal()

    try:
        existing = db.query(User).filter(User.username == "demo").first()

        if existing:
            print("✅ Demo user already exists")
            return

        demo = User(
            username="demo",
            password=pwd_context.hash("Demo@123"),
            role="admin",
        )

        db.add(demo)
        db.commit()

        print("✅ Demo user created successfully")

    finally:
        db.close()