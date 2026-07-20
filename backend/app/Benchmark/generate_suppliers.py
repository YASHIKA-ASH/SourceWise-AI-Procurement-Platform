import pandas as pd
import random

materials = [
    "Steel",
    "Copper",
    "Plastic",
    "Aluminium",
    "Glass"
]

countries = [
    "India",
    "China",
    "Germany",
    "USA",
    "Japan"
]

suppliers = []

for i in range(1,101):

    suppliers.append({

        "supplier":f"Supplier_{i}",

        "material":random.choice(materials),

        "price":round(random.uniform(80,150),2),

        "lead_time":random.randint(2,15),

        "quality":random.randint(70,100),

        "delivery":random.randint(75,99),

        "defect":round(random.uniform(0.5,5),2),

        "sustainability":random.randint(60,100),

        "capacity":random.randint(3000,20000),

        "country":random.choice(countries)

    })

df=pd.DataFrame(suppliers)

import os

os.makedirs("app/data", exist_ok=True)

df.to_csv("app/data/suppliers.csv", index=False)

print(df.head())