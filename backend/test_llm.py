from app.rag.llm import ask_gemini

context = """
Supplier : Tata Steel

Warranty : 24 months

Penalty :
2% of order value
"""

answer = ask_llm(

    "What is the warranty period?",

    context

)

print(answer)