from time import perf_counter

from app.rag.vectordb import search
from app.rag.bm25 import search_bm25
from app.rag.reranker import rerank


def hybrid_search(query, top_k=5):
    semantic = search(query, top_k)
    keyword = search_bm25(query, top_k)
    return semantic, keyword


def merge_results(semantic, keyword):
    merged = []

    docs = semantic["documents"][0]
    metas = semantic["metadatas"][0]

    for doc, meta in zip(docs, metas):
        merged.append({
            "text": doc,
            "supplier": meta["supplier"],
            "contract": meta["contract"],
            "page": meta["page"],
            "source": "semantic"
        })

    for chunk in keyword:
        merged.append({
            "text": chunk["text"],
            "supplier": chunk["supplier"],
            "contract": chunk["contract"],
            "page": chunk["page"],
            "source": "keyword"
        })

    return merged


def deduplicate(results):
    unique = {}

    for item in results:
        unique[item["text"]] = item

    return list(unique.values())


def retrieve(query):
    start = perf_counter()

    semantic, keyword = hybrid_search(query)

    merged = merge_results(semantic, keyword)
    merged = deduplicate(merged)
    merged = rerank(query, merged)

    retrieval_time = perf_counter() - start

    return {
        "documents": merged[:5],
        "retrieval_time": retrieval_time
    }