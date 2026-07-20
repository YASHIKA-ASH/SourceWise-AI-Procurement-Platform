import os
import json
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.aws.s3 import upload_file
from io import BytesIO
from app.aws.s3 import upload_file
from app.database.database import get_db
from app.models.supplier import Supplier
from app.aws.logger import logger
from app.parser.quotation_parser import extract_pdf_text
from app.ai.gemini import extract_supplier_details

router = APIRouter(tags=["Quotation Parser"])


@router.post("/upload-quotation")
async def upload_quotation(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    os.makedirs("app/uploads", exist_ok=True)

    path = f"app/uploads/{file.filename}"

    contents = await file.read()

    

    with open(path, "wb") as f:
        f.write(contents)

    contract_url = upload_file(
        BytesIO(contents),
        file.filename
    )


    text = extract_pdf_text(path)

    result = extract_supplier_details(text)

    try:
        data = json.loads(
            result.replace("```json", "").replace("```", "")
        )
    except:
        return {
            "error": "AI returned invalid JSON",
            "raw": result
        }

    supplier = Supplier(
        contract_url=contract_url,
        name=data.get("supplier_name"),
        material=data.get("material"),
        price_per_unit=float(data.get("price_per_unit") or 0),
        lead_time=int(data.get("lead_time") or 0),
        quality_score=95,
        defect_rate=1,
        on_time_delivery=95,
        sustainability_score=90,
        country=data.get("country")
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return {
        "message": "Supplier saved successfully",
        "supplier": supplier
    }
@router.post("/test-parser")
def test_parser(db: Session = Depends(get_db)):

    supplier = Supplier(
        name="Tata Steel",
        material="Cold Rolled Steel",
        price_per_unit=420,
        lead_time=12,
        quality_score=97,
        defect_rate=1.2,
        on_time_delivery=96,
        sustainability_score=90,
        country="India"
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier
