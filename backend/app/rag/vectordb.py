import chromadb
from app.rag.embeddings import get_model
import chromadb

_client = None
_collection = None
def get_collection():
    global _client, _collection

    if _collection is None:
        _client = chromadb.PersistentClient(path="chromadb")
        _collection = _client.get_or_create_collection(
            name="supplier_contracts"
        )

    return _collection

def store_chunks(chunks, embeddings):

    ids = []
    documents = []
    metadatas = []
    vectors = []

    for chunk, vector in zip(chunks, embeddings):

        ids.append(
            f'{chunk["supplier"]}_{chunk["chunk_id"]}'
        )

        documents.append(
            chunk["text"]
        )

        metadatas.append({
            "supplier": chunk["supplier"],
            "contract": chunk["contract"],
            "page": chunk["page"],
            "chunk_id": chunk["chunk_id"]
        })

        vectors.append(
            vector.tolist()
        )

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=vectors
    )

    print(f"✅ Stored {len(ids)} chunks in ChromaDB")


def search(query, top_k=3):

    model = get_model()

    query_vector = model.encode(query).tolist()

    return collection.query(
        query_embeddings=[query_vector],
        n_results=top_k
    )