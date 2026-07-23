import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { procurementAPI } from "../api/api";

export default function SupplierRanking() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    try {
      const res = await procurementAPI.getSupplierRanking();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getIcon(index) {
    if (index === 0)
      return <Trophy className="text-yellow-500" size={28} />;

    if (index === 1)
      return <Medal className="text-gray-400" size={28} />;

    if (index === 2)
      return <Award className="text-amber-700" size={28} />;

    return (
      <span className="font-bold text-gray-500 text-lg">
        #{index + 1}
      </span>
    );
  }

  if (loading)
    return (
      <div className="text-center mt-20 text-xl">
        Loading Rankings...
      </div>
    );

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Supplier Rankings
        </h1>

        <p className="text-gray-500 mt-2">
          AI ranked suppliers based on procurement score.
        </p>

      </div>

      <div className="grid gap-5">

        {suppliers.map((supplier, index) => (

          <div
            key={index}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition"
          >

            <div className="flex items-center gap-5">

              {getIcon(index)}

              <div>

                <h2 className="text-xl font-semibold">
                  {supplier.supplier}
                </h2>

                <p className="text-gray-500">
                  {supplier.country}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-4 gap-10 text-center">

              <div>

                <p className="text-gray-500 text-sm">
                  Cost
                </p>

                <h3 className="font-bold">
                  ${supplier.cost}
                </h3>

              </div>

              <div>

                <p className="text-gray-500 text-sm">
                  Lead Time
                </p>

                <h3 className="font-bold">
                  {supplier.lead_time}
                </h3>

              </div>

              <div>

                <p className="text-gray-500 text-sm">
                  Risk
                </p>

                <h3 className="font-bold">
                  {supplier.risk_level}
                </h3>

              </div>

              <div>

                <p className="text-gray-500 text-sm">
                  AI Score
                </p>

                <h3 className="text-2xl font-bold text-blue-600">
                  {supplier.overall_score}
                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}