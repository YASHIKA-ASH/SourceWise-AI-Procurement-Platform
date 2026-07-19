from app.rag.bm25 import search_bm25

results = search_bm25(
    "Warranty"
)

print(results)