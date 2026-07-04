import os

from google import genai

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def extract_supplier_details(text):

    prompt = f"""
You are a procurement AI.

Extract the following fields from this supplier quotation.

Return ONLY valid JSON.

Fields:

supplier_name

material

price_per_unit

currency

lead_time

payment_terms

warranty

country

incoterms

minimum_order_quantity

Text:

{text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    print(response.text)

    return response.text