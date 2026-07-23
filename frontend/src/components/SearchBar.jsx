import {
  LayoutDashboard,
  Truck,
  Brain,
  FileBarChart,
  Bot,
  Database,
  LogOut,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Suppliers",
    icon: Truck,
    path: "/suppliers",
  },
  {
    title: "Simulation",
    icon: Brain,
    path: "/simulation",
  },
  {
    title: "Reports",
    icon: FileBarChart,
    path: "/reports",
  },
  {
    title: "AI Copilot",
    icon: Bot,
    path: "/copilot",
  },
  {
    title: "RAG",
    icon: Database,
    path: "/rag",
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div
      style={{
        width: 250,
        height: "100vh",
        background: "#131C2E",
        color: "white",
        position: "fixed",
      }}
    >
      <h2
        style={{
          padding: 25,
          borderBottom: "1px solid #2E3A4F",
        }}
      >
        SourceWise
      </h2>

      {menu.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              gap: 15,
              padding: 18,
              color: "white",
              textDecoration: "none",
              background:
                location.pathname === item.path
                  ? "#2563EB"
                  : "transparent",
            }}
          >
            <Icon size={20} />

            {item.title}
          </Link>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          display: "flex",
          gap: 10,
        }}
      >
        <LogOut />

        Logout
      </div>
    </div>
  );
}