import time

from starlette.middleware.base import BaseHTTPMiddleware

from app.database.database import SessionLocal
from app.services.logger import log_request


class TimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        start = time.perf_counter()

        response = await call_next(request)

        latency = (time.perf_counter() - start) * 1000

        db = SessionLocal()

        try:
            log_request(
                db=db,
                endpoint=request.url.path,
                latency=round(latency, 2),
                status_code=response.status_code
            )
        finally:
            db.close()

        response.headers["X-Response-Time"] = f"{latency:.2f} ms"

        print(
            f"{request.method} {request.url.path} : {latency:.2f} ms"
        )

        return response