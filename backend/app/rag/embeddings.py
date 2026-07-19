from sentence_transformers import SentenceTransformer
from time import perf_counter

model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embeddings(chunks):

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

    print(f"✅ Embedding Time: {embedding_time:.3f} sec")

    return embeddings, embedding_time