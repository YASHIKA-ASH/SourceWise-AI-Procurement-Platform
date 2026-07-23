export default function ExecutiveSummary({
  result,
  loading,
  downloadReport,
}) {
  if (!result) return null;

  const box = {
    background: "#131C2E",
    padding: 25,
    borderRadius: 12,
    border: "1px solid #1F2A3C",
    marginTop: 25,
  };

  const button = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #8B96AC",
    background: "transparent",
    color: "#8B96AC",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={box}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Executive Decision Summary
        </h2>

        <button
          onClick={downloadReport}
          disabled={loading}
          style={button}
        >
          {loading
            ? "Generating..."
            : "Download Report"}
        </button>
      </div>

      <hr />

      <p>
        <b>Supplier:</b>{" "}
        {result.best_supplier.supplier}
      </p>

      <p>
        <b>Score:</b>{" "}
        {result.best_supplier.score}
      </p>

      <p>
        <b>Risk:</b>{" "}
        {result.best_supplier.risk}
      </p>

      <p>
        <b>Risk Level:</b>{" "}
        {result.best_supplier.risk_level}
      </p>

      <p>
        <b>Lead Time:</b>{" "}
        {result.best_supplier.lead_time} days
      </p>

      <p>
        <b>Confidence:</b>{" "}
        {result.best_supplier.confidence}%
      </p>

      <p>
        <b>Scenario:</b>{" "}
        {result.scenario}
      </p>

      <p>
        <b>Supplier Reliability:</b>{" "}
        {result.best_supplier.supplier_reliability}
      </p>

      <p>
        <b>Cost Efficiency:</b>{" "}
        {result.best_supplier.cost_efficiency}
      </p>

      <p>
        <b>Production Delay:</b>{" "}
        {result.best_supplier.delay_days} days
      </p>

      <p>
        <b>Production Loss:</b> ₹
        {result.best_supplier.production_loss.toLocaleString()}
      </p>

      <p>
        <b>Estimated Saving:</b> ₹
        {result.best_supplier.estimated_saving.toLocaleString()}
      </p>

      <p>
        <b>Stockout Days:</b>{" "}
        {result.stockout_days}
      </p>
    </div>
  );
}