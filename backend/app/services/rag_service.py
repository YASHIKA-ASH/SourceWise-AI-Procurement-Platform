import json

from app.database.redis import redis_client
from app.rag.retriever import retrieve
from app.rag.llm import ask_gemini


def answer_question(question):

    cache_key = f"rag:{question.lower().strip()}"

    cached = redis_client.get(cache_key)

    if cached is not None:

        print("========== REDIS ==========")
        print("Module    : RAG Cache")
        print("Cache Hit : YES")
        print("===========================")

        if isinstance(cached, bytes):
            cached = cached.decode("utf-8")

        return json.loads(cached)

    print("========== REDIS ==========")
    print("Module    : RAG Cache")
    print("Cache Hit : NO")
    print("===========================")

    retrieval = retrieve(question)

    docs = retrieval["documents"]

    llm_result = ask_gemini(question, docs)

    response = {
        "question": question,
        "answer": llm_result["answer"],
        "sources": docs,
        "retrieval_time": retrieval["retrieval_time"],
        "llm_time": llm_result["llm_time"]
    }

    redis_client.setex(
        cache_key,
        3600,
        json.dumps(response)
    )

    return response