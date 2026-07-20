import pandas as pd

df = pd.read_csv("benchmark_results.csv")

baseline_cost = df["baseline_cost"].sum()
ai_cost = df["ai_cost"].sum()

cost_improvement = (
    (baseline_cost - ai_cost) / baseline_cost
) * 100

lead_improvement = (
    (df["baseline_lead"].mean() - df["ai_lead"].mean())
    / df["baseline_lead"].mean()
) * 100

quality_improvement = (
    (df["ai_quality"].mean() - df["baseline_quality"].mean())
    / df["baseline_quality"].mean()
) * 100

defect_reduction = (
    (df["baseline_defect"].mean() - df["ai_defect"].mean())
    / df["baseline_defect"].mean()
) * 100

stockout_reduction = (
    (df["baseline_stockout"].sum() - df["ai_stockout"].sum())
    / max(df["baseline_stockout"].sum(), 1)
) * 100

print("=" * 50)
print("SOURCEWISE PROCUREMENT BENCHMARK")
print("=" * 50)

print(f"Procurement Cost Reduction : {cost_improvement:.2f}%")
print(f"Lead Time Improvement      : {lead_improvement:.2f}%")
print(f"Quality Improvement        : {quality_improvement:.2f}%")
print(f"Defect Reduction           : {defect_reduction:.2f}%")
print(f"Stockout Reduction         : {stockout_reduction:.2f}%")