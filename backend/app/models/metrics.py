from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class PerformanceLog(Base):
    __tablename__ = "performance_logs"

    id = Column(Integer, primary_key=True, index=True)

    endpoint = Column(String)

    latency_ms = Column(Float)

    sql_time_ms = Column(Float)

    retrieval_ms = Column(Float)

    llm_ms = Column(Float)

    cache_hit = Column(Boolean)

    tokens_used = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())