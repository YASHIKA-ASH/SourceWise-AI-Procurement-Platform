from app.rag.vectordb import search

results = search("What is the warranty period?")

print(results)