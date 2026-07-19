from app.rag.parser import extract_text
from app.rag.chunker import chunk_text
from app.rag.embeddings import create_embeddings

text = extract_text(
    "contracts/tata_steel_contract.pdf"
)

chunks = chunk_text(
    text,
    supplier="Tata Steel"
)

vectors = create_embeddings(chunks)

print(vectors.shape)