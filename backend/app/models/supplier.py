from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    material = Column(String, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    lead_time = Column(Integer, nullable=False)
    quality_score = Column(Float, nullable=False)
    defect_rate = Column(Float, nullable=False)
    on_time_delivery = Column(Float, nullable=False)
    sustainability_score = Column(Float, nullable=False)
    country = Column(String, nullable=False)