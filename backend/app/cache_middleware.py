from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from .cache import cache

MUTATING_PREFIXES = ("/products", "/suppliers", "/components", "/offers", "/settings")


class CacheInvalidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if (
            request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}
            and response.status_code < 400
            and request.url.path.startswith(MUTATING_PREFIXES)
        ):
            cache.delete_pattern("sourcewise:data:*")
        return response
