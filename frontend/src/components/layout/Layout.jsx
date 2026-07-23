import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: 250,
          background: "#F8FAFC",
        }}
      >
        <Navbar />

        <div style={{ padding: 30 }}>
          {children}
        </div>
      </div>
    </div>
  );
}