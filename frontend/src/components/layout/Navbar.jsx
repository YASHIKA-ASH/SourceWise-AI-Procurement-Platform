import { Bell, Search } from "lucide-react";

export default function Navbar() {
  return (
    <div
      style={{
        height: 70,
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <h2>AI Procurement Dashboard</h2>

      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <Search />

        <Bell />

        <img
          src="https://i.pravatar.cc/40"
          alt=""
          style={{
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}