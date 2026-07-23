from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.supplier import Supplier
from app.services.comparison import calculate_score

router = APIRouter(
    prefix="",
    tags=["Reports"]
)


@router.get("/report")
def download_report(
    quantity: int,
    inventory: int,
    daily_usage: int,
    db: Session = Depends(get_db)
):

    suppliers = db.query(Supplier).all()

    suppliers.sort(
        key=calculate_score,
        reverse=True
    )

    best_supplier = suppliers[0] if suppliers else None

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    title = styles["Heading1"]
    title.textColor = HexColor("#0F172A")

    body = styles["BodyText"]

    story = []

    story.append(
        Paragraph(
            "SourceWise Procurement Report",
            title
        )
    )

    story.append(
        Paragraph(
            f"<b>Required Quantity:</b> {quantity}",
            body
        )
    )

    story.append(
        Paragraph(
            f"<b>Current Inventory:</b> {inventory}",
            body
        )
    )

    story.append(
        Paragraph(
            f"<b>Daily Usage:</b> {daily_usage}",
            body
        )
    )

    if best_supplier:

        story.append(
            Paragraph(
                "<br/><b>Recommended Supplier</b>",
                body
            )
        )

        story.append(
            Paragraph(
                f"Supplier : {best_supplier.name}",
                body
            )
        )

        story.append(
            Paragraph(
                f"Material : {best_supplier.material}",
                body
            )
        )

        story.append(
            Paragraph(
                f"Country : {best_supplier.country}",
                body
            )
        )

        story.append(
            Paragraph(
                f"Procurement Score : {calculate_score(best_supplier)}",
                body
            )
        )

    doc.build(story)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            "attachment; filename=procurement_report.pdf"
        },
    )