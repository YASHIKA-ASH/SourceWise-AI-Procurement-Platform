import { Download, FileText } from "lucide-react";
import { procurementAPI } from "../api/api";
import toast from "react-hot-toast";

export default function Reports() {
  async function downloadReport() {
    try {
      const response = await procurementAPI.downloadReport();

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "SourceWise_Report.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report");
    }
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Procurement Reports
        </h1>

        <p className="text-gray-500 mt-2">
          Download AI-generated procurement analysis reports.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex items-center gap-5">

          <div className="bg-blue-100 p-5 rounded-xl">
            <FileText
              size={45}
              className="text-blue-600"
            />
          </div>

          <div>

            <h2 className="text-2xl font-semibold">
              Procurement Analysis Report
            </h2>

            <p className="text-gray-500 mt-2">
              Includes supplier comparison, AI recommendation,
              procurement insights, cost analysis and risk assessment.
            </p>

          </div>

        </div>

        <button
          onClick={downloadReport}
          className="mt-8 flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition"
        >
          <Download size={20} />
          Download PDF Report
        </button>

      </div>

    </div>
  );
}