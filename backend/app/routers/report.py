from fastapi import APIRouter
from fastapi.responses import FileResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from app.services.report_generator import create_report
router = APIRouter(tags=["Report"])


@router.get("/report")
def generate_report():

    doc = SimpleDocTemplate("Procurement_Report.pdf")

    styles = getSampleStyleSheet()

    elements = []

    elements.append(Paragraph("SourceWise AI Procurement Report", styles["Heading1"]))
    elements.append(Paragraph("Supplier Recommendation Report", styles["Heading2"]))
    elements.append(Paragraph("Generated Successfully", styles["BodyText"]))

    doc.build(elements)

    return FileResponse(
        "Procurement_Report.pdf",
        media_type="application/pdf",
        filename="Procurement_Report.pdf"
    )
@router.get("/report")
def report():

    data = {
        "supplier": "Tata Steel",
        "cost": 4200000,
        "lead_time": 12,
        "score": 91.8
    }

    file = create_report(data)

    return FileResponse(
        file,
        media_type="application/pdf",
        filename="Procurement_Report.pdf"
    )