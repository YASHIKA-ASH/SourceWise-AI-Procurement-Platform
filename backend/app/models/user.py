from sqlalchemy import Column, Integer, String

from app.database.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(100), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    role = Column(String(30), nullable=False)