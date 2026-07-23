import { useEffect, useState } from "react";
import {
  Users,
  Clock3,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  TriangleAlert,
  Trophy,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { procurementAPI } from "../api/api";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [overviewRes, riskRes] = await Promise.all([
        procurementAPI.getOverview(),
        procurementAPI.getRiskAnalysis(),
      ]);

      setOverview(overviewRes.data);
      setRisk(riskRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-xl font-semibold text-slate-600">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Suppliers",
      value: overview?.suppliers_count ?? 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Lead Time",
      value: `${overview?.avg_lead_time ?? 0} Days`,
      icon: Clock3,
      color: "bg-green-500",
    },
    {
      title: "Lowest Cost",
      value: `$${overview?.lowest_cost ?? 0}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
    {
      title: "Low Risk",
      value: risk?.summary?.low_risk ?? 0,
      icon: ShieldCheck,
      color: "bg-emerald-500",
    },
  ];

  const riskChart = [
    {
      name: "Low",
      value: risk?.summary?.low_risk ?? 0,
    },
    {
      name: "Medium",
      value: risk?.summary?.medium_risk ?? 0,
    },
    {
      name: "High",
      value: risk?.summary?.high_risk ?? 0,
    },
  ];

  const supplierChart =
    risk?.suppliers?.map((item) => ({
      name: item.supplier,
      score: item.overall_score,
    })) || [];

  const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

  const bestSupplier =
    risk?.suppliers?.reduce((a, b) =>
      a.overall_score > b.overall_score ? a : b
    ) || null;

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-bold text-slate-800">
            Executive Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            AI-powered procurement overview
          </p>

        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">

          <Sparkles />

          <div>

            <p className="text-sm opacity-90">
              AI Status
            </p>

            <h3 className="font-bold">
              Operational
            </h3>

          </div>

        </div>

      </div>

      {/* KPI */}

      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6"
            >
              <div
                className={`${card.color} w-16 h-16 rounded-2xl text-white flex items-center justify-center mb-6`}
              >
                <Icon size={30} />
              </div>

              <p className="text-slate-500">
                {card.title}
              </p>

              <h2 className="text-4xl font-bold mt-2">
                {card.value}
              </h2>

            </div>
          );
        })}

      </div>

      {/* Charts */}

      <div className="grid lg:grid-cols-2 gap-8">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-bold mb-6">
            Supplier Performance
          </h2>

          <ResponsiveContainer width="100%" height={320}>

            <BarChart data={supplierChart}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="score" radius={[8,8,0,0]} />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-bold mb-6">
            Risk Distribution
          </h2>

          <ResponsiveContainer width="100%" height={320}>

            <PieChart>

              <Pie
                data={riskChart}
                dataKey="value"
                outerRadius={110}
                label
              >
                {riskChart.map((entry, index) => (
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

      {/* Bottom Cards */}

      <div className="grid lg:grid-cols-3 gap-8">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center gap-3 mb-5">

            <Trophy className="text-yellow-500" />

            <h2 className="font-bold text-xl">
              Best Supplier
            </h2>

          </div>

          {bestSupplier && (
            <>
              <h3 className="text-2xl font-bold">
                {bestSupplier.supplier}
              </h3>

              <p className="mt-2 text-slate-500">
                Overall Score
              </p>

              <div className="text-5xl font-bold text-blue-600 mt-3">
                {bestSupplier.overall_score}
              </div>
            </>
          )}

        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center gap-3 mb-5">

            <TrendingUp className="text-green-600" />

            <h2 className="font-bold text-xl">
              AI Insight
            </h2>

          </div>

          <p className="text-slate-600 leading-7">
            Supplier performance remains stable with consistently low
            procurement risk. Current sourcing strategy minimizes lead
            time while maintaining competitive pricing.
          </p>

        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center gap-3 mb-5">

            <TriangleAlert className="text-red-500" />

            <h2 className="font-bold text-xl">
              Risk Summary
            </h2>

          </div>

          <div className="space-y-4">

            {risk?.suppliers?.map((supplier) => (

              <div
                key={supplier.supplier}
                className="flex justify-between items-center border rounded-xl p-4"
              >

                <div>

                  <h4 className="font-semibold">
                    {supplier.supplier}
                  </h4>

                  <p className="text-sm text-slate-500">
                    Risk Score: {supplier.risk_score}
                  </p>

                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    supplier.risk_level === "Low"
                      ? "bg-green-100 text-green-700"
                      : supplier.risk_level === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {supplier.risk_level}
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}