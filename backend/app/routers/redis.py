from fastapi import APIRouter
from app.database.redis import redis_client

router = APIRouter(
    prefix="/redis",
    tags=["Redis"]
)


@router.get("/health")
def redis_health():

    try:
        redis_client.ping()

        return {
            "status": "healthy",
            "redis": "connected"
        }

    except Exception as e:

        return {
            "status": "down",
            "error": str(e)
        }
    
@router.get("/stats")
def redis_stats():

    info = redis_client.info()

    return {
        "connected_clients": info["connected_clients"],
        "used_memory_human": info["used_memory_human"],
        "total_commands_processed": info["total_commands_processed"],
        "keyspace_hits": info["keyspace_hits"],
        "keyspace_misses": info["keyspace_misses"]
    }