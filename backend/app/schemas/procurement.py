from pydantic import BaseModel

class Procurement(BaseModel):
    quantity: int
    inventory: int
    daily_usage: int
    scenario: str = "Normal Procurement"