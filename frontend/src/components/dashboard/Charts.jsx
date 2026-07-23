import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", spend: 4000 },
  { month: "Feb", spend: 5200 },
  { month: "Mar", spend: 4800 },
  { month: "Apr", spend: 6700 },
  { month: "May", spend: 7100 },
  { month: "Jun", spend: 8600 },
];

export default function Charts() {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 14,
      }}
    >
      <h3>Monthly Procurement</h3>

      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            dataKey="spend"
            stroke="#2563EB"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}