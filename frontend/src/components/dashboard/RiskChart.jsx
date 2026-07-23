import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Low", value: 62 },
  { name: "Medium", value: 24 },
  { name: "High", value: 14 },
];

const COLORS = [
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

export default function RiskChart() {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 14,
      }}
    >
      <h3>Supplier Risk</h3>

      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
          >
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={COLORS[i]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}