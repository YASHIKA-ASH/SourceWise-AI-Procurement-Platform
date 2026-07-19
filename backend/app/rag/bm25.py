from rank_bm25 import BM25Okapi

bm25 = None
documents = []


def build_bm25(chunks):

    global bm25, documents

    documents = chunks

    tokenized = [
        chunk["text"].lower().split()
        for chunk in chunks
    ]

    bm25 = BM25Okapi(tokenized)

    print(f"✅ BM25 built with {len(chunks)} chunks")


def search_bm25(query, top_k=3):

    global bm25, documents

    if bm25 is None:
        raise RuntimeError(
            "BM25 index has not been built."
        )

    tokens = query.lower().split()

    return bm25.get_top_n(
        tokens,
        documents,
        n=top_k
    )