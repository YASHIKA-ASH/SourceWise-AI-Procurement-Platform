import pandas as pd
import random

materials=[
"Steel",
"Copper",
"Plastic",
"Glass",
"Aluminium"
]

requests=[]

for i in range(500):

    requests.append({

        "request_id":i+1,

        "material":random.choice(materials),

        "quantity":random.randint(500,8000),

        "inventory":random.randint(0,4000),

        "daily_usage":random.randint(20,300)

    })

df=pd.DataFrame(requests)

df.to_csv("app/data/requests.csv",index=False)

print(df.head())