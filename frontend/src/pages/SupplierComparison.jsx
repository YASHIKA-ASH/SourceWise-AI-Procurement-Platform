import { useEffect, useState } from "react";
import { procurementAPI } from "../api/api";

export default function SupplierComparison() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadComparison();
  }, []);

  async function loadComparison() {
    try {
      const res = await procurementAPI.compareSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Supplier Comparison
        </h1>

        <p className="text-gray-500">
          Compare suppliers across cost, quality, delivery and overall score.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>
              <th className="p-4 text-left">Supplier</th>
              <th className="p-4 text-left">Cost</th>
              <th className="p-4 text-left">Lead Time</th>
              <th className="p-4 text-left">Quality</th>
              <th className="p-4 text-left">Risk</th>
              <th className="p-4 text-left">Overall</th>
            </tr>

          </thead>

          <tbody>

            {suppliers.map((supplier, index) => (

              <tr
                key={index}
                className="border-b hover:bg-slate-50"
              >

                <td className="p-4 font-semibold">
                  {supplier.supplier}
                </td>

                <td className="p-4">
                  ${supplier.cost}
                </td>

                <td className="p-4">
                  {supplier.lead_time}
                </td>

                <td className="p-4">
                  {supplier.quality_score}
                </td>

                <td className="p-4">
                  {supplier.risk_level}
                </td>

                <td className="p-4">
                  {supplier.overall_score}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}