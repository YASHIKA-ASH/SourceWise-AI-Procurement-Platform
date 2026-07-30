from __future__ import annotations

import json
import logging
from typing import Any

try:
    import redis
    from redis.exceptions import RedisError
except ImportError:  # The application remains usable without caching in local development.
    redis = None

    class RedisError(Exception):
        pass

from .config import settings

logger = logging.getLogger("sourcewise.cache")


class RedisCache:
    def __init__(self) -> None:
        self._client = None
        if settings.redis_url and redis is not None:
            self._client = redis.Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=settings.redis_socket_timeout_seconds,
                socket_timeout=settings.redis_socket_timeout_seconds,
                health_check_interval=30,
            )

    @property
    def configured(self) -> bool:
        return self._client is not None

    def ping(self) -> bool:
        if not self._client:
            return False
        try:
            return bool(self._client.ping())
        except RedisError as exc:
            logger.warning("Redis ping failed: %s", exc)
            return False

    def get_json(self, key: str) -> Any | None:
        if not self._client:
            return None
        try:
            value = self._client.get(key)
            return json.loads(value) if value else None
        except (RedisError, json.JSONDecodeError) as exc:
            logger.warning("Redis get failed for %s: %s", key, exc)
            return None

    def set_json(self, key: str, value: Any, ttl: int | None = None) -> bool:
        if not self._client:
            return False
        try:
            self._client.setex(key, ttl or settings.cache_ttl_seconds, json.dumps(value, default=str))
            return True
        except RedisError as exc:
            logger.warning("Redis set failed for %s: %s", key, exc)
            return False

    def delete_pattern(self, pattern: str) -> int:
        if not self._client:
            return 0
        deleted = 0
        try:
            keys = list(self._client.scan_iter(match=pattern, count=200))
            if keys:
                deleted = int(self._client.delete(*keys))
        except RedisError as exc:
            logger.warning("Redis invalidation failed for %s: %s", pattern, exc)
        return deleted

    def rate_limit_exceeded(self, key: str, *, limit: int, window_seconds: int) -> bool:
        if not self._client:
            return False
        try:
            namespaced = f"sourcewise:rate:{key}"
            with self._client.pipeline() as pipe:
                pipe.incr(namespaced)
                pipe.ttl(namespaced)
                count, ttl = pipe.execute()
            if ttl == -1:
                self._client.expire(namespaced, window_seconds)
            return int(count) > limit
        except RedisError as exc:
            logger.warning("Redis rate-limit check failed: %s", exc)
            return False

    def revoke_access_token(self, jti: str, ttl_seconds: int) -> None:
        if not self._client or ttl_seconds <= 0:
            return
        try:
            self._client.setex(f"sourcewise:revoked:{jti}", ttl_seconds, "1")
        except RedisError as exc:
            logger.warning("Unable to store access-token revocation: %s", exc)

    def is_access_token_revoked(self, jti: str) -> bool:
        if not self._client:
            return False
        try:
            return bool(self._client.exists(f"sourcewise:revoked:{jti}"))
        except RedisError as exc:
            logger.warning("Unable to check access-token revocation: %s", exc)
            return False

    def close(self) -> None:
        if self._client:
            try:
                self._client.close()
            except RedisError:
                pass


cache = RedisCache()
