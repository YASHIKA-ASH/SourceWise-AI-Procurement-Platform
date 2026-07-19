import os
from time import perf_counter

from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def build_context(docs):

    context = ""

    for doc in docs:

        context += f"""
Supplier: {doc['supplier']}
Contract: {doc['contract']}
Page: {doc['page']}

{doc['text']}

----------------------------------------

"""

    return context


def ask_gemini(question, docs):

    context = build_context(docs)

    prompt = f"""
You are an AI Procurement Assistant.

Answer ONLY using the provided contract context.

If the answer is unavailable, reply:

"I couldn't find this information in the uploaded supplier contracts."

Always include:
- Supplier
- Contract
- Page

Context:
{context}

Question:
{question}
"""

    start = perf_counter()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    llm_time = perf_counter() - start

    return {
    "answer": response.text.strip(),
    "llm_time": llm_time
    }   