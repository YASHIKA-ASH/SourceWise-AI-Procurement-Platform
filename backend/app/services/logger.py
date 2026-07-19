
from sqlalchemy.orm import Session
from app.models.performance_log import PerformanceLog
def log_metrics(db, endpoint, latency):
    log = PerformanceLog(
        endpoint=endpoint,
        latency_ms=latency
    )
    db.add(log)
    db.commit()


def log_request(
    db,
    endpoint,
    latency,
    status_code,
    sql_time=0,
    retrieval_time=0,
    llm_time=0,
    cache_hit=False,
    embedding_time=0,
    tokens=0
):

    log = PerformanceLog(
    endpoint=endpoint,
    latency_ms=latency,
    sql_time_ms=sql_time,
    retrieval_ms=retrieval_time,
    llm_ms=llm_time,
    cache_hit=cache_hit,
    tokens_used=tokens,
    status_code=status_code,
    embedding_time=embedding_time
    )

    db.add(log)
    db.commit()