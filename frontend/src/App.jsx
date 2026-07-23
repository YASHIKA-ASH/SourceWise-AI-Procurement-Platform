import { Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Cpu,
  Bot,
  BookOpen,
  FileText,
  LogOut,
  BarChart3,
} from "lucide-react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/SupplierComparison";
import Simulation from "./pages/Simulation";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Copilot from "./pages/Copilot";
import Rag from "./pages/Rag";
import NotFound from "./pages/NotFound";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/rag" element={<Rag />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
