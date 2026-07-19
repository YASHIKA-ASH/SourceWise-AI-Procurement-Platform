import os

from app.rag.parser import extract_text
from app.rag.chunker import chunk_text
from app.rag.embeddings import create_embeddings
from app.rag.vectordb import store_chunks
from app.rag.bm25 import build_bm25


def build_indexes(contract_folder="contracts"):

    all_chunks = []

    for filename in os.listdir(contract_folder):

        if not filename.endswith(".pdf"):
            continue

        print(f"\n📄 Indexing {filename}")

        filepath = os.path.join(contract_folder, filename)

        supplier = filename.replace(".pdf", "")

        text = extract_text(filepath)

        chunks = chunk_text(
            text=text,
            supplier=supplier
        )

        embeddings, embedding_time = create_embeddings(chunks)

        print(f"✅ Embedding Time: {embedding_time:.3f} sec")

        store_chunks(
            chunks,
            embeddings
        )

        all_chunks.extend(chunks)

    build_bm25(all_chunks)

    print("\n✅ All supplier contracts indexed successfully.")