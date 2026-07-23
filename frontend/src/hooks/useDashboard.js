import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboard";

export default function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await getDashboard();
    setDashboard(res.data);
    setLoading(false);
  }

  return {
    loading,
    dashboard,
    refresh: load,
  };
}