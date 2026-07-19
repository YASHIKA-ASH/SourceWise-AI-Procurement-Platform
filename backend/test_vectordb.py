from app.rag.parser import extract_text
from app.rag.chunker import chunk_text
from app.rag.embeddings import create_embeddings
from app.rag.vectordb import store_chunks

text = extract_text(
    "contracts/tata_steel_contract.pdf"
)

chunks = chunk_text(
    text,
    supplier="Tata Steel"
)

embeddings, embedding_time = create_embeddings(chunks)

store_chunks(
    chunks,
    embeddings
)

print("Stored Successfully")