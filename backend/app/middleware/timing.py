import time

from starlette.middleware.base import BaseHTTPMiddleware

from app.database.database import SessionLocal
from app.services.logger import log_request


class TimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        
        start = time.perf_counter()

        
        response = await call_next(request)

        
        latency = round(
            (time.perf_counter() - start) * 1000,
            2
        )

        
        sql_time = getattr(
            request.state,
            "sql_time",
            0
        )

        cache_hit = getattr(
    request.state,
    "cache_hit",
    False
)
        db = SessionLocal()

        try:

            log_request(
                db=db,
                endpoint=request.url.path,
                latency=latency,
                sql_time=sql_time,
                cache_hit=cache_hit,
                status_code=response.status_code
            )

        finally:

            db.close()

        
        response.headers["X-Response-Time"] = f"{latency} ms"

        
        print(
            f"""
===========================
Endpoint   : {request.url.path}
Method     : {request.method}
Latency    : {latency} ms
SQL Time   : {sql_time} ms
Status     : {response.status_code}
===========================
"""
        )

        return response