import { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_URL = "https://sourcewise-ai-procurement-platform-1.onrender.com";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function riskLevel(risk) {
  const riskValue = typeof risk === "string" ? parseFloat(risk) : risk;
  if (riskValue < 0.18) return "Low";
  if (riskValue < 0.3) return "Medium";
  return "High";
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(10000);
  const [inventory, setInventory] = useState(7000);
  const [dailyUsage, setDailyUsage] = useState(500);
  const [result, setResult] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    suppliersCount: 0,
    avgLeadTime: 0,
    lowestCost: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);
  // Load dashboard analytics on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    setDashboardLoading(true);

    const [analyticsRes, riskRes] = await Promise.all([
      apiClient.get("/analytics"),
      apiClient.get("/dashboard/risk-analysis"),
    ]);

    setDashboardData({
      suppliersCount: analyticsRes.data.suppliers_count || 0,
      avgLeadTime: analyticsRes.data.avg_lead_time || 0,
      lowestCost: analyticsRes.data.lowest_cost || 0,
    });

    setRiskData(riskRes.data);

  } catch (err) {
    console.error("Failed to load dashboard data:", err);

    setDashboardData({
      suppliersCount: 0,
      avgLeadTime: 0,
      lowestCost: 0,
    });

    setRiskData(null);

  } finally {
    setDashboardLoading(false);
  }
};

  const simulate = async () => {
    setError("");

    if (quantity <= 0 || inventory < 0 || dailyUsage <= 0) {
      setError("Enter a positive quantity and daily usage.");
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post("/simulate", {
        quantity,
        inventory,
        daily_usage: dailyUsage,
      });

      const data = response.data;

      // Transform API response to match expected UI structure
      const transformedResult = {
        comparison: data.comparison || [],
        stockout_days: data.stockout_days || 0,
        scenario:
          quantity > inventory
            ? `Shortfall of ${(quantity - inventory).toLocaleString()} units against current inventory`
            : "Inventory covers demand; simulation is precautionary",
        best_supplier: {
          supplier: data.best_supplier?.supplier || "N/A",
          score: data.best_supplier?.score || 0,
          risk: data.best_supplier?.risk || "0.00",
          risk_level: riskLevel(data.best_supplier?.risk || 0),
          lead_time: data.best_supplier?.lead_time || 0,
          confidence: Math.min(99, 70 + Math.round((data.best_supplier?.score || 0) / 5)),
          supplier_reliability: `${Math.round(100 - (parseFloat(data.best_supplier?.risk || 0) * 100))}%`,
          cost_efficiency: calculateCostEfficiency(data.comparison),
          delay_days: data.best_supplier?.delay_days || 0,
          production_loss: calculateProductionLoss(
            data.best_supplier?.delay_days || 0,
            dailyUsage
          ),
          estimated_saving: calculateEstimatedSaving(data.comparison),
        },
      };

      setResult(transformedResult);
    } catch (err) {
      console.error("Simulation error:", err);
      if (err.response?.data?.detail) {
        setError(`API Error: ${err.response.data.detail}`);
      } else if (err.message) {
        setError(`Failed to run simulation: ${err.message}`);
      } else {
        setError("Simulation failed. Please check your inputs and try again.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostEfficiency = (comparison) => {
    if (!comparison || comparison.length === 0) return "0%";
    const worstCost = Math.max(...comparison.map((c) => c.cost || 0));
    const bestCost = Math.min(...comparison.map((c) => c.cost || 0));
    if (worstCost === 0) return "0%";
    return `${Math.round(((worstCost - bestCost) / worstCost) * 100)}%`;
  };

  const calculateProductionLoss = (delayDays, dailyUsage) => {
    return Math.round(delayDays * dailyUsage * 6.5);
  };

  const calculateEstimatedSaving = (comparison) => {
    if (!comparison || comparison.length < 2) return 0;
    const costs = comparison.map((c) => c.cost || 0).sort((a, b) => a - b);
    return Math.max(0, costs[costs.length - 1] - costs[0]);
  };

  const downloadReport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/report", {
        params: {
          quantity,
          inventory,
          daily_usage: dailyUsage,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "procurement_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Report download error:", err);
      setError("Failed to download report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 30,
        background: "#0B1220",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Sans', Arial, sans-serif",
        color: "#E8ECF3",
      }}
    >
      <h1 style={{ margin: 0, letterSpacing: 0.3 }}>SourceWise AI Procurement Platform</h1>
      <h3 style={{ color: "#8B96AC", marginTop: 8, marginBottom: 20, fontWeight: 400 }}>
        Enterprise Procurement Decision Support System
      </h3>

      <hr style={{ borderColor: "#1F2A3C" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 20,
          marginTop: 20,
        }}
      >
        <Card
          title="Suppliers"
          value={dashboardLoading ? "..." : String(dashboardData.suppliersCount)}
        />
        <Card
          title="Avg Lead Time"
          value={dashboardLoading ? "..." : `${dashboardData.avgLeadTime.toFixed(1)} Days`}
        />
        <Card
          title="Lowest Cost"
          value={dashboardLoading ? "..." : `₹${dashboardData.lowestCost.toFixed(2)}/unit`}
        />
        <Card
          title="Risk Index"
          value={result ? result.best_supplier.risk_level : "—"}
        />
        {riskData && (
  <>
    <Card
      title="High Risk"
      value={riskData.summary.high_risk}
    />

    <Card
      title="Medium Risk"
      value={riskData.summary.medium_risk}
    />

    <Card
      title="Low Risk"
      value={riskData.summary.low_risk}
    />
  </>
)}
      </div>

      <div style={box}>
        <h2 style={{ marginTop: 0 }}>Procurement Simulation</h2>

        <label style={label}>Required quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Required quantity"
          style={input}
        />

        <label style={label}>Current inventory</label>
        <input
          type="number"
          value={inventory}
          onChange={(e) => setInventory(Number(e.target.value))}
          placeholder="Current inventory"
          style={input}
        />

        <label style={label}>Daily usage</label>
        <input
          type="number"
          value={dailyUsage}
          onChange={(e) => setDailyUsage(Number(e.target.value))}
          placeholder="Daily usage"
          style={input}
        />

        <div style={{ marginTop: 16 }}>
          <button onClick={simulate} disabled={loading} style={buttonPrimary}>
            {loading ? "Running AI analysis..." : "Run simulation"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#2A1416",
            border: "1px solid #F87171",
            padding: 15,
            borderRadius: 10,
            color: "#F87171",
            marginTop: 20,
          }}
        >
          {error}
        </div>
      )}

      {!result && !error && (
        <div style={box}>
          <h2 style={{ marginTop: 0 }}>Ready for simulation</h2>
          <p style={{ color: "#8B96AC" }}>Enter procurement values and click Run simulation.</p>
        </div>
      )}

      {result && (
        <>
          <div style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginTop: 0 }}>Executive decision summary</h2>
              <button onClick={downloadReport} disabled={loading} style={buttonSecondary}>
                {loading ? "Generating..." : "Download Report (PDF)"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 25 }}>
            <div style={box}>
              <h3 style={{ marginTop: 0 }}>Business summary</h3>

              <p><b>Supplier:</b> {result.best_supplier.supplier}</p>
              <p><b>Score:</b> {result.best_supplier.score}</p>
              <p><b>Risk:</b> {result.best_supplier.risk}</p>
              <p>
                <b>Risk level:</b>{" "}
                <span
                  style={{
                    color:
                      result.best_supplier.risk_level === "Low"
                        ? "#34D399"
                        : result.best_supplier.risk_level === "Medium"
                        ? "#FBBF24"
                        : "#F87171",
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  {result.best_supplier.risk_level}
                </span>
              </p>

              <h4>Procurement score</h4>
              <div style={{ width: "100%", height: 22, background: "#1F2A3C", borderRadius: 20 }}>
                <div
                  style={{
                    width: `${result.best_supplier.score}%`,
                    height: "100%",
                    background: "#2DD4BF",
                    borderRadius: 20,
                    color: "#04342C",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {result.best_supplier.score}%
                </div>
              </div>

              <p style={{ marginTop: 16 }}><b>Lead time:</b> {result.best_supplier.lead_time} days</p>
              <p><b>Confidence:</b> {result.best_supplier.confidence}%</p>
              <p><b>Procurement scenario:</b> {result.scenario}</p>
              <p><b>Supplier reliability:</b> {result.best_supplier.supplier_reliability}</p>
              <p><b>Cost efficiency:</b> {result.best_supplier.cost_efficiency}</p>
              <p><b>Production delay:</b> {result.best_supplier.delay_days} days</p>
              <p><b>Production loss:</b> ₹{result.best_supplier.production_loss.toLocaleString()}</p>
              <p><b>Estimated saving:</b> ₹{result.best_supplier.estimated_saving.toLocaleString()}</p>
              <p><b>Stockout days:</b> {result.stockout_days}</p>
            </div>

            <div style={{ ...box, background: "#101B2E" }}>
              <h3 style={{ marginTop: 0 }}>AI procurement decision</h3>
              <p>
                <b>{result.best_supplier.supplier}</b> was selected because it achieves the
                highest procurement score while keeping production delay and operational risk low.
              </p>
              <ul style={{ color: "#C7CEDB", paddingLeft: 18 }}>
                <li>Lowest operational risk</li>
                <li>Balanced procurement cost</li>
                <li>High supplier quality</li>
                <li>Reliable delivery performance</li>
                <li>Recommended by weighted scoring model</li>
              </ul>
            </div>
          </div>

          <div style={box}>
            <h2 style={{ marginTop: 0 }}>Supplier comparison</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead style={{ background: "#15406B", color: "#E8ECF3" }}>
                <tr>
                  <th style={th}>Rank</th>
                  <th style={th}>Supplier</th>
                  <th style={th}>Cost</th>
                  <th style={th}>Lead time</th>
                  <th style={th}>Delay</th>
                  <th style={th}>Risk</th>
                  <th style={th}>Risk level</th>
                  <th style={th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.map((s, idx) => (
                  <tr key={s.supplier || idx} style={{ background: (idx + 1) % 2 === 0 ? "#101B2E" : "transparent" }}>
                    <td style={td}>#{idx + 1}</td>
                    <td style={td}>{s.supplier}</td>
                    <td style={td}>₹{(s.cost || 0).toLocaleString()}</td>
                    <td style={td}>{s.lead_time}</td>
                    <td style={td}>{s.delay_days}</td>
                    <td style={td}>{s.risk}</td>
                    <td style={td}>{s.risk_level || riskLevel(s.risk)}</td>
                    <td style={td}>{s.score}</td>
                  </tr>
                ))}
              </tbody>
              </table>
</div>

{result.comparison.length > 0 && (
    <>
        <div style={box}>
            <h2 style={{ marginTop: 0 }}>Cost comparison</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={result.comparison}>
                    <CartesianGrid stroke="#1F2A3C" vertical={false} />
                    <XAxis dataKey="supplier" stroke="#8B96AC" />
                    <YAxis stroke="#8B96AC" />
                    <Tooltip contentStyle={{ background: "#131C2E", border: "1px solid #1F2A3C" }} />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]} fill="#2DD4BF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={box}>
                <h2 style={{ marginTop: 0 }}>Lead time comparison</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={result.comparison}>
                    <CartesianGrid stroke="#1F2A3C" vertical={false} />
                    <XAxis dataKey="supplier" stroke="#8B96AC" />
                    <YAxis stroke="#8B96AC" />
                    <Tooltip contentStyle={{ background: "#131C2E", border: "1px solid #1F2A3C" }} />
                    <Bar dataKey="lead_time" radius={[6, 6, 0, 0]} fill="#F5A623" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={box}>
                <h2 style={{ marginTop: 0 }}>Supplier score comparison</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={result.comparison}>
                    <CartesianGrid stroke="#1F2A3C" vertical={false} />
                    <XAxis dataKey="supplier" stroke="#8B96AC" />
                    <YAxis stroke="#8B96AC" />
                    <Tooltip contentStyle={{ background: "#131C2E", border: "1px solid #1F2A3C" }} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#378ADD" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#131C2E",
        padding: 20,
        borderRadius: 12,
        border: "1px solid #1F2A3C",
      }}
    >
      <h4 style={{ marginBottom: 10, color: "#8B96AC", fontWeight: 400 }}>{title}</h4>
      <h2 style={{ color: "#2DD4BF", margin: 0 }}>{value}</h2>
    </div>
  );
}

const box = {
  background: "#131C2E",
  padding: 25,
  marginTop: 25,
  borderRadius: 12,
  border: "1px solid #1F2A3C",
};

const label = {
  display: "block",
  fontSize: 13,
  color: "#8B96AC",
  marginBottom: 6,
  marginTop: 14,
};

const input = {
  width: "100%",
  maxWidth: 320,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #1F2A3C",
  background: "#0B1220",
  color: "#E8ECF3",
  fontSize: 14,
};

const buttonPrimary = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid #2DD4BF",
  background: "#2DD4BF",
  color: "#04342C",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonSecondary = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid #8B96AC",
  background: "transparent",
  color: "#8B96AC",
  fontWeight: "bold",
  cursor: "pointer",
};

const th = { padding: "10px 8px", textAlign: "left" };
const td = { padding: "10px 8px" };
