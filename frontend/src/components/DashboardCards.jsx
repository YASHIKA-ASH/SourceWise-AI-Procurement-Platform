import React from "react";

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
      <h4
        style={{
          marginBottom: 10,
          color: "#8B96AC",
          fontWeight: 400,
        }}
      >
        {title}
      </h4>

      <h2
        style={{
          color: "#2DD4BF",
          margin: 0,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default function DashboardCards({
  dashboardLoading,
  dashboardData,
  result,
  riskData,
}) {
  return (
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
        value={
          dashboardLoading
            ? "..."
            : dashboardData.suppliersCount
        }
      />

      <Card
        title="Avg Lead Time"
        value={
          dashboardLoading
            ? "..."
            : `${dashboardData.avgLeadTime.toFixed(1)} Days`
        }
      />

      <Card
        title="Lowest Cost"
        value={
          dashboardLoading
            ? "..."
            : `₹${dashboardData.lowestCost.toFixed(2)}`
        }
      />

      <Card
        title="Risk Index"
        value={
          result
            ? result.best_supplier.risk_level
            : "—"
        }
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
  );
}