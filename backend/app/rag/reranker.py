from sentence_transformers import CrossEncoder

reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


def rerank(question, docs):

    pairs = []

    for doc in docs:

        pairs.append(
            [question, doc["text"]]
        )

    scores = reranker.predict(pairs)

    for doc, score in zip(docs, scores):

        doc["score"] = float(score)

    docs.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return docs