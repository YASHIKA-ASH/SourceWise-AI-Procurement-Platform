from fastapi import APIRouter
from fastapi.responses import FileResponse
import pandas as pd
from app.decision_engine import SUPPLIERS

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/")
def report():

    df = pd.DataFrame(SUPPLIERS)

    df.to_excel("supplier_report.xlsx", index=False)

    return FileResponse("supplier_report.xlsx")