export default function AIRecommendation({ result }) {
  if (!result) return null;

  const box = {
    background: "#101B2E",
    padding: 25,
    borderRadius: 12,
    border: "1px solid #1F2A3C",
  };

  return (
    <div style={box}>
      <h3 style={{ marginTop: 0 }}>AI Procurement Decision</h3>

      <p>
        <b>{result.best_supplier.supplier}</b> was selected because it
        achieved the highest procurement score while maintaining low
        operational risk.
      </p>

      <ul style={{ color: "#C7CEDB", paddingLeft: 20 }}>
        <li>Highest weighted procurement score</li>
        <li>Lowest operational risk</li>
        <li>Balanced procurement cost</li>
        <li>Reliable delivery performance</li>
        <li>High supplier quality</li>
        <li>Recommended by AI decision engine</li>
      </ul>

      <hr />

      <p>
        <b>Confidence:</b> {result.best_supplier.confidence}%
      </p>

      <p>
        <b>Risk Level:</b> {result.best_supplier.risk_level}
      </p>

      <p>
        <b>Supplier Reliability:</b>{" "}
        {result.best_supplier.supplier_reliability}
      </p>

      <p>
        <b>Estimated Saving:</b> ₹
        {result.best_supplier.estimated_saving.toLocaleString()}
      </p>
    </div>
  );
}