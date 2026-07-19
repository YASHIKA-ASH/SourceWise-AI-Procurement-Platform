def chunk_text(text, supplier, chunk_size=500, overlap=100):
    """
    Split text into overlapping chunks and attach metadata.
    """

    chunks = []
    start = 0
    chunk_id = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        chunks.append({
            "supplier": supplier,
            "contract": f"{supplier}.pdf",
            "page": 1,   # We'll improve this later with real page numbers
            "chunk_id": chunk_id,
            "text": text[start:end]
        })

        chunk_id += 1
        start += chunk_size - overlap

    return chunks