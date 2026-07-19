import os

from app.rag.parser import extract_text
from app.rag.chunker import chunk_text
from app.rag.embeddings import create_embeddings
from app.rag.vectordb import store_chunks
from app.rag.bm25 import build_bm25

CONTRACT_FOLDER = "contracts"

all_chunks = []

for filename in os.listdir(CONTRACT_FOLDER):

    if filename.endswith(".pdf"):

        print(f"\nIndexing {filename}")

        filepath = os.path.join(CONTRACT_FOLDER, filename)

        text = extract_text(filepath)

        supplier = filename.replace(".pdf", "")

        chunks = chunk_text(text, supplier)

        all_chunks.extend(chunks)

        embeddings, embedding_time = create_embeddings(chunks)

        store_chunks(chunks, embeddings)

        print(f"Stored {len(chunks)} chunks")


build_bm25(all_chunks)