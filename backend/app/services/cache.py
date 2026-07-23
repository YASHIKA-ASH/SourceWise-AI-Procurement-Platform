import json
from app.database.redis import redis_client

CACHE_KEY = "suppliers"


def get_cached_suppliers():
    try:
        data = redis_client.get(CACHE_KEY)

        if data:
            return json.loads(data)

        return None

    except Exception:
        # Redis unavailable → fall back to DB
        return None


def cache_suppliers(suppliers):
    try:
        redis_client.set(
            CACHE_KEY,
            json.dumps(suppliers),
            ex=300
        )
    except Exception:
        # Ignore if Redis is unavailable
        pass


def clear_supplier_cache():
    try:
        redis_client.delete(CACHE_KEY)
    except Exception:
        pass