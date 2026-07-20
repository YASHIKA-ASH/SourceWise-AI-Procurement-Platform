import pandas as pd

# Load data
suppliers = pd.read_csv("app/data/suppliers.csv")
requests = pd.read_csv("app/data/requests.csv")

results = []

for _, req in requests.iterrows():

    # Filter suppliers by material and capacity
    available = suppliers[
        (suppliers["material"] == req["material"]) &
        (suppliers["capacity"] >= req["quantity"])
    ].copy()

    if available.empty:
        continue

    # --------------------------
    # Baseline: Lowest Price
    # --------------------------
    eligible = available[
    (available["quality"] >= 75) &
    (available["delivery"] >= 80)
]

    if eligible.empty:
        eligible = available

    baseline = eligible.loc[eligible["price"].idxmin()]

    # Purchase Cost
    baseline_purchase = baseline["price"] * req["quantity"]

    # Delay Penalty
    baseline_delay_penalty = max(0, baseline["lead_time"] - 5) * 50000

    # Defect Cost
    baseline_defect_cost = (
        req["quantity"]
        * (baseline["defect"] / 100)
        * 1200
    )

    # Inventory / Stockout
    inventory_days = (
        req["inventory"] / req["daily_usage"]
        if req["daily_usage"] > 0 else 0
    )

    baseline_stockout = baseline["lead_time"] > inventory_days

    baseline_stockout_cost = 100000 if baseline_stockout else 0

    baseline_cost = (
        baseline_purchase
        + baseline_delay_penalty
        + baseline_defect_cost
        + baseline_stockout_cost
    )

    inventory_days = (
        req["inventory"] / req["daily_usage"]
        if req["daily_usage"] > 0 else 0
    )

    baseline_stockout = baseline["lead_time"] > inventory_days

    # --------------------------
    # SourceWise Score
    # --------------------------

    available["price_score"] = (
        available["price"].max() - available["price"]
    ) / (
        available["price"].max() - available["price"].min() + 1e-6
    )

    available["lead_score"] = (
        available["lead_time"].max() - available["lead_time"]
    ) / (
        available["lead_time"].max() - available["lead_time"].min() + 1e-6
    )

    available["quality_score"] = available["quality"] / 100
    available["delivery_score"] = available["delivery"] / 100
    available["sustainability_score"] = available["sustainability"] / 100
    available["defect_score"] = 1 - (available["defect"] / 5)

    available["score"] = (
    0.20 * available["price_score"] +
    0.30 * available["lead_score"] +
    0.20 * available["quality_score"] +
    0.15 * available["delivery_score"] +
    0.10 * available["defect_score"] +
    0.05 * available["sustainability_score"]
)

    ai = available.loc[available["score"].idxmax()]

    ai_purchase = ai["price"] * req["quantity"]

    ai_delay_penalty = max(0, ai["lead_time"] - 5) * 50000

    ai_defect_cost = (
        req["quantity"]
        * (ai["defect"] / 100)
        * 1200
    )

    ai_stockout = ai["lead_time"] > inventory_days

    ai_stockout_cost = 100000 if ai_stockout else 0

    ai_cost = (
        ai_purchase
        + ai_delay_penalty
        + ai_defect_cost
        + ai_stockout_cost
    )

    ai_stockout = ai["lead_time"] > inventory_days

    results.append({

        "baseline_cost": baseline_cost,
        "ai_cost": ai_cost,

        "baseline_lead": baseline["lead_time"],
        "ai_lead": ai["lead_time"],

        "baseline_quality": baseline["quality"],
        "ai_quality": ai["quality"],

        "baseline_defect": baseline["defect"],
        "ai_defect": ai["defect"],

        "baseline_stockout": int(baseline_stockout),
        "ai_stockout": int(ai_stockout)

    })

results = pd.DataFrame(results)

results.to_csv("benchmark_results.csv", index=False)

print(results.head())
print("\nSimulation Complete.")