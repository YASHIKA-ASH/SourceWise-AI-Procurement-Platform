import time
from starlette.middleware.base import BaseHTTPMiddleware

class TimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        start = time.perf_counter()

        response = await call_next(request)

        end = time.perf_counter()

        latency = (end - start) * 1000

        response.headers["X-Response-Time"] = f"{latency:.2f} ms"

        print(
            f"{request.method} {request.url.path} : {latency:.2f} ms"
        )

        return response