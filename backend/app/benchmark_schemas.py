from pydantic import BaseModel, Field, model_validator


class SimulationBenchmarkRequest(BaseModel):
    """Configuration for a repeatable procurement Monte Carlo benchmark."""

    scenario_count: int = Field(default=500, ge=50, le=2000)
    seed: int = Field(default=42, ge=0, le=2_147_483_647)
    baseline_strategy: str = Field(default="manual_baseline")
    optimized_strategy: str = Field(default="balanced")

    demand_volatility_percentage: float = Field(default=25, ge=0, le=100)
    supplier_price_volatility_percentage: float = Field(default=15, ge=0, le=100)
    transportation_volatility_percentage: float = Field(default=20, ge=0, le=150)
    maximum_lead_time_delay_days: int = Field(default=14, ge=0, le=180)
    supplier_disruption_probability_percentage: float = Field(default=8, ge=0, le=100)

    @model_validator(mode="after")
    def strategies_must_differ(self):
        if self.baseline_strategy == self.optimized_strategy:
            raise ValueError("Baseline and optimized strategies must be different")
        return self
