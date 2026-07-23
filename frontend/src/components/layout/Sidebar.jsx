import {
  LayoutDashboard,
  Truck,
  Cpu,
  BarChart3,
  Bot,
  BookOpen,
  FileText,
  LogOut,
  Sparkles,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menu = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Suppliers",
    path: "/suppliers",
    icon: Truck,
  },
  {
    title: "Simulation",
    path: "/simulation",
    icon: Cpu,
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    title: "AI Copilot",
    path: "/copilot",
    icon: Bot,
  },
  {
    title: "RAG Assistant",
    path: "/rag",
    icon: BookOpen,
  },
  {
    title: "Reports",
    path: "/reports",
    icon: FileText,
  },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="w-72 bg-slate-950 text-white flex flex-col shadow-2xl">

      {/* Logo */}

      <div className="px-8 py-8 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">

            <Sparkles size={24} />

          </div>

          <div>

            <h1 className="text-2xl font-bold">
              SourceWise
            </h1>

            <p className="text-xs text-slate-400">
              AI Procurement Platform
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}

      <div className="flex-1 px-4 py-6 space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg"
                    : "hover:bg-slate-800"
                }`
              }
            >

              <Icon
                size={21}
                className="group-hover:scale-110 transition-transform"
              />

              <span className="font-medium">
                {item.title}
              </span>

            </NavLink>

          );

        })}

      </div>

      {/* Footer */}

      <div className="border-t border-slate-800 p-5">

        <div className="mb-5 rounded-xl bg-slate-900 p-4">

          <p className="text-sm text-slate-400">
            Logged in as
          </p>

          <p className="font-semibold text-white">
            Procurement Manager
          </p>

        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-500 hover:bg-red-600 transition py-3 font-semibold"
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </aside>
  );
}