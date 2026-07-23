export default function SimulationForm({
  quantity,
  setQuantity,
  inventory,
  setInventory,
  dailyUsage,
  setDailyUsage,
  simulate,
  loading,
}) {
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

  const label = {
    display: "block",
    fontSize: 13,
    color: "#8B96AC",
    marginBottom: 6,
    marginTop: 14,
  };

  const button = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #2DD4BF",
    background: "#2DD4BF",
    color: "#04342C",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        background: "#131C2E",
        padding: 25,
        marginTop: 25,
        borderRadius: 12,
        border: "1px solid #1F2A3C",
      }}
    >
      <h2>Procurement Simulation</h2>

      <label style={label}>Required Quantity</label>

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        style={input}
      />

      <label style={label}>Current Inventory</label>

      <input
        type="number"
        value={inventory}
        onChange={(e) => setInventory(Number(e.target.value))}
        style={input}
      />

      <label style={label}>Daily Usage</label>

      <input
        type="number"
        value={dailyUsage}
        onChange={(e) => setDailyUsage(Number(e.target.value))}
        style={input}
      />

      <br />
      <br />

      <button
        onClick={simulate}
        disabled={loading}
        style={button}
      >
        {loading
          ? "Running AI Analysis..."
          : "Run Simulation"}
      </button>
    </div>
  );
}