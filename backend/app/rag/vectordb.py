import chromadb
from app.rag.embeddings import model

client = chromadb.PersistentClient(
    path="chromadb"
)

collection = client.get_or_create_collection(
    name="supplier_contracts"
)


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

    query_vector = model.encode(query).tolist()

    return collection.query(
        query_embeddings=[query_vector],
        n_results=top_k
    )