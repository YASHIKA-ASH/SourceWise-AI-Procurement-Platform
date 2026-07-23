const data = [
  "Supplier Added",
  "Purchase Approved",
  "Simulation Completed",
  "Inventory Updated",
  "Report Generated",
];

export default function RecentActivity() {
  return (
    <div
      style={{
        background: "#fff",
        padding: 25,
        borderRadius: 14,
      }}
    >
      <h2>Recent Activity</h2>

      {data.map((item) => (
        <div
          key={item}
          style={{
            padding: 15,
            borderBottom:
              "1px solid #E5E7EB",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}