from sentence_transformers import SentenceTransformer
from time import perf_counter

_model = None


def get_model():
    global _model

    if _model is None:
        print("Loading embedding model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Embedding model loaded.")

    return _model


def create_embeddings(chunks):

    model = get_model()

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    start = perf_counter()

    embeddings = model.encode(
        texts,
        convert_to_numpy=True
    )

    embedding_time = perf_counter() - start

    print(f"Embedding Time: {embedding_time:.3f} sec")

    return embeddings, embedding_time