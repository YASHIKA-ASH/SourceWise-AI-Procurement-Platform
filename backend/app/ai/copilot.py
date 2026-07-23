import os

from google import genai


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def ask_copilot(question: str):

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""
You are SourceWise AI Procurement Copilot.

Answer as a procurement AI assistant.

Question:
{question}
"""
    )

    return response.text