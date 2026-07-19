from app.rag.vectordb import search

results = search(
    "Which supplier offers a 36 month warranty?"
)

print(results["documents"][0])

print(results["metadatas"][0])