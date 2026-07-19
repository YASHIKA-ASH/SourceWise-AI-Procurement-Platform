from app.rag.parser import extract_text

text = extract_text("contracts/tata_steel_contract.pdf")

print(text[:2000])