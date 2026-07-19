from app.rag.parser import extract_text
from app.rag.chunker import chunk_text

text = extract_text("contracts/tata_steel_contract.pdf")

chunks = chunk_text(
    text,
    supplier="Tata Steel"
)

print(chunks[0])