from reportlab.platypus import SimpleDocTemplate, Table

def create_report(data):

    pdf = SimpleDocTemplate("Procurement_Report.pdf")

    table = Table([
        ["Supplier","Cost","Lead Time","Score"],
        [
            data["supplier"],
            str(data["cost"]),
            str(data["lead_time"]),
            str(data["score"])
        ]
    ])

    pdf.build([table])

    return "Procurement_Report.pdf"