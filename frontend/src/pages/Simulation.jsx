import { useState } from "react";
import { procurementAPI } from "../api/api";
import toast from "react-hot-toast";

export default function Simulation() {
  const [form, setForm] = useState({
    quantity: "",
    inventory: "",
    daily_usage: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: Number(e.target.value),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await procurementAPI.simulate(form);

      setResult(res.data);

      toast.success("Simulation Completed");
    } catch (err) {
      console.error(err);
      toast.error("Simulation Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Procurement Simulation
        </h1>

        <p className="text-gray-500">
          Compare suppliers using AI scoring.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-3 gap-5"
        >

          <div>
            <label className="font-semibold">
              Required Quantity
            </label>

            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="mt-2 w-full border rounded-lg p-3"
              required
            />
          </div>

          <div>
            <label className="font-semibold">
              Current Inventory
            </label>

            <input
              type="number"
              name="inventory"
              value={form.inventory}
              onChange={handleChange}
              className="mt-2 w-full border rounded-lg p-3"
              required
            />
          </div>

          <div>
            <label className="font-semibold">
              Daily Usage
            </label>

            <input
              type="number"
              name="daily_usage"
              value={form.daily_usage}
              onChange={handleChange}
              className="mt-2 w-full border rounded-lg p-3"
              required
            />
          </div>

          <div className="md:col-span-3">

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
            >
              {loading ? "Running..." : "Run Simulation"}
            </button>

          </div>

        </form>

      </div>

      {result && (

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-2xl font-bold mb-6">
            AI Recommendation
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="border rounded-lg p-5">
              <h3 className="font-semibold mb-2">
                Best Supplier
              </h3>

              <p className="text-3xl font-bold text-blue-600">
                {result.best_supplier || "N/A"}
              </p>
            </div>

            <div className="border rounded-lg p-5">
              <h3 className="font-semibold mb-2">
                Score
              </h3>

              <p className="text-3xl font-bold text-green-600">
                {result.score || result.overall_score || 0}
              </p>
            </div>

          </div>

          <div className="mt-8">

            <h3 className="text-xl font-semibold mb-2">
              AI Explanation
            </h3>

            <div className="bg-gray-100 rounded-lg p-5 whitespace-pre-wrap">
              {result.explanation ||
                result.reason ||
                result.message ||
                "Recommendation generated successfully."}
            </div>

          </div>

        </div>

      )}

    </div>
  );
}