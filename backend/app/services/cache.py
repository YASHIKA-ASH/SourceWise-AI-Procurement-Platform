import json
from app.database.redis import redis_client


CACHE_KEY = "suppliers"


def get_cached_suppliers():

    data = redis_client.get(CACHE_KEY)

    if data:
        return json.loads(data)

    return None


def cache_suppliers(suppliers):

    redis_client.set(
        CACHE_KEY,
        json.dumps(suppliers),
        ex=300
    )


def clear_supplier_cache():

    redis_client.delete(CACHE_KEY)