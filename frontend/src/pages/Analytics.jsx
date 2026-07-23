import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { procurementAPI } from "../api/api";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [overviewRes, riskRes] = await Promise.all([
        procurementAPI.getOverview(),
        procurementAPI.getRiskAnalysis(),
      ]);

      setOverview(overviewRes.data);
      setRisk(riskRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  if (!overview || !risk) {
    return (
      <div className="text-center text-xl mt-20">
        Loading Analytics...
      </div>
    );
  }

  const riskData = [
    {
      name: "Low",
      value: risk.summary.low_risk,
    },
    {
      name: "Medium",
      value: risk.summary.medium_risk,
    },
    {
      name: "High",
      value: risk.summary.high_risk,
    },
  ];

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Procurement Analytics
        </h1>

        <p className="text-gray-500">
          Supplier insights and procurement performance.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-semibold mb-5">
            Overview
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Suppliers</span>
              <b>{overview.suppliers_count}</b>
            </div>

            <div className="flex justify-between">
              <span>Lead Time</span>
              <b>{overview.avg_lead_time} Days</b>
            </div>

            <div className="flex justify-between">
              <span>Lowest Cost</span>
              <b>${overview.lowest_cost}</b>
            </div>

          </div>

        </div>

        <div className="bg-white rounded-xl shadow p-6 md:col-span-2">

          <h2 className="font-semibold mb-5">
            Supplier Scores
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart data={risk.suppliers}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="supplier" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="overall_score"
                fill="#2563eb"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="font-semibold mb-5">
          Risk Distribution
        </h2>

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <PieChart>

            <Pie
              data={riskData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >

              {riskData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}