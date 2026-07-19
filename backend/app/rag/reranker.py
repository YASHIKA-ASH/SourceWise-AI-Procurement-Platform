import os
from sentence_transformers import CrossEncoder

_reranker = None

USE_RERANKER = (
    os.getenv("USE_RERANKER", "false").lower() == "true"
)


def get_reranker():
    global _reranker

    if _reranker is None:
        print("Loading reranker...")
        _reranker = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )
        print("Reranker loaded.")

    return _reranker


def rerank(question, docs):

    if not USE_RERANKER:
        return docs

    if not docs:
        return docs

    reranker = get_reranker()

    pairs = [
        [question, doc["text"]]
        for doc in docs
    ]

    scores = reranker.predict(pairs)

    for doc, score in zip(docs, scores):
        doc["score"] = float(score)

    docs.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return docs