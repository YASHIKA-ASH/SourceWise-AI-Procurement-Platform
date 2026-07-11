from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.database import Base


class PerformanceLog(Base):
    __tablename__ = "performance_logs"

    id = Column(Integer, primary_key=True, index=True)

    endpoint = Column(String, nullable=False)

    latency_ms = Column(Float, default=0)

    sql_time_ms = Column(Float, default=0)

    retrieval_ms = Column(Float, default=0)

    llm_ms = Column(Float, default=0)

    cache_hit = Column(Boolean, default=False)

    tokens_used = Column(Integer, default=0)

    status_code = Column(Integer, default=200)

    created_at = Column(DateTime(timezone=True), server_default=func.now())