from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)

    material = Column(String, nullable=False)

    current_stock = Column(Integer, nullable=False)

    daily_consumption = Column(Integer, nullable=False)

    safety_stock = Column(Integer, nullable=False)

    unit = Column(String, nullable=False)

    warehouse = Column(String, nullable=False)