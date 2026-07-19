from app.rag.parser import extract_text
from app.rag.chunker import chunk_text
from app.rag.bm25 import create_bm25
from app.rag.retrieve import hybrid_search

text = extract_text(
    "contracts/tata_steel_contract.pdf"
)

chunks = chunk_text(
    text,
    supplier="Tata Steel"
)

bm25 = create_bm25(chunks)

results = hybrid_search(
    "Warranty",
    bm25
)

print(results)