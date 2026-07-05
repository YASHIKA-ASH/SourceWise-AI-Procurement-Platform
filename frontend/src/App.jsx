import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ---- Supplier base data -----------------------------------------------
// In the original file this lived on a backend the artifact can't reach.
// It's modeled here so the simulation actually runs.
const SUPPLIERS = [
  { supplier: "Vantex Metals", unitCost: 39.8, baseLeadTime: 9, riskWeight: 0.12 },
  { supplier: "Orion Components", unitCost: 44.5, baseLeadTime: 13, riskWeight: 0.22 },
  { supplier: "Harbor Supply Co.", unitCost: 41.2, baseLeadTime: 18, riskWeight: 0.35 },
];

function riskLevel(risk) {
  if (risk < 0.18) return "Low";
  if (risk < 0.3) return "Medium";
  return "High";
}

function runSimulation({ quantity, inventory, dailyUsage }) {
  const shortfall = Math.max(0, quantity - inventory);
  const daysOfCover = dailyUsage > 0 ? inventory / dailyUsage : 0;

  const comparison = SUPPLIERS.map((s) => {
    const cost = Math.round(shortfall * s.unitCost);
    const delayDays = Math.max(0, Math.round(s.baseLeadTime - daysOfCover));
    const risk = Math.min(0.95, s.riskWeight + delayDays * 0.01);

    // Weighted score: lower cost, lower lead time, lower risk => higher score
    const costScore = 1 - s.unitCost / 60;
    const leadScore = 1 - s.baseLeadTime / 30;
    const riskScore = 1 - risk;
    const score = Math.round(
      (costScore * 0.4 + leadScore * 0.35 + riskScore * 0.25) * 100
    );

    return {
      supplier: s.supplier,
      cost,
      lead_time: s.baseLeadTime,
      delay_days: delayDays,
      risk: risk.toFixed(2),
      risk_level: riskLevel(risk),
      score: Math.max(0, Math.min(100, score)),
    };
  }).sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const best = comparison[0];
  const productionLoss = best.delay_days * dailyUsage * 6.5;
  const worstCost = Math.max(...comparison.map((c) => c.cost));
  const estimatedSaving = Math.max(0, worstCost - best.cost);
  const stockoutDays = Math.max(0, Math.round((shortfall / (dailyUsage || 1)) - best.lead_time));

  return {
    comparison,
    stockout_days: stockoutDays,
    scenario:
      shortfall > 0
        ? `Shortfall of ${shortfall.toLocaleString()} units against current inventory`
        : "Inventory covers demand; simulation is precautionary",
    best_supplier: {
      supplier: best.supplier,
      score: best.score,
      risk: best.risk,
      risk_level: best.risk_level,
      lead_time: best.lead_time,
      confidence: Math.min(99, 70 + Math.round(best.score / 5)),
      supplier_reliability: `${Math.round(100 - Number(best.risk) * 100)}%`,
      cost_efficiency: `${Math.round(100 - (best.cost / (worstCost || 1)) * 100)}%`,
      delay_days: best.delay_days,
      production_loss: Math.round(productionLoss),
      estimated_saving: Math.round(estimatedSaving),
    },
  };
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(10000);
  const [inventory, setInventory] = useState(7000);
  const [dailyUsage, setDailyUsage] = useState(500);
  const [result, setResult] = useState(null);

  const simulate = () => {
    setError("");

    if (quantity <= 0 || inventory < 0 || dailyUsage <= 0) {
      setError("Enter a positive quantity and daily usage.");
      return;
    }

    setLoading(true);
    // Simulated latency so the loading state is visible; no network call.
    setTimeout(() => {
      try {
        const data = runSimulation({ quantity, inventory, dailyUsage });
        setResult(data);
      } catch (err) {
        console.error(err);
        setError("Simulation failed. Check your inputs and try again.");
      } finally {
        setLoading(false);
      }
    }, 500);
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
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 20,
          marginTop: 20,
        }}
      >
        <Card title="Suppliers" value={String(SUPPLIERS.length)} />
        <Card title="Avg Lead Time" value="13.3 Days" />
        <Card title="Lowest Cost" value="₹39.8/unit" />
        <Card title="Risk Index" value={result ? result.best_supplier.risk_level : "—"} />
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
            <h2 style={{ marginTop: 0 }}>Executive decision summary</h2>
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
                {result.comparison.map((s) => (
                  <tr key={s.supplier} style={{ background: s.rank % 2 === 0 ? "#101B2E" : "transparent" }}>
                    <td style={td}>#{s.rank}</td>
                    <td style={td}>{s.supplier}</td>
                    <td style={td}>₹{s.cost.toLocaleString()}</td>
                    <td style={td}>{s.lead_time}</td>
                    <td style={td}>{s.delay_days}</td>
                    <td style={td}>{s.risk}</td>
                    <td style={td}>{s.risk_level}</td>
                    <td style={td}>{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

const th = { padding: "10px 8px", textAlign: "left" };
const td = { padding: "10px 8px" };
