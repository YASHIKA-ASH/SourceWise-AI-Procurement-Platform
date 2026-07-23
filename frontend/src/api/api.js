import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: {
  Accept: "application/json",
},
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error("Unauthorized");
    } else if (error.response?.status === 500) {
      toast.error("Internal Server Error");
    } else if (error.message === "Network Error") {
      toast.error("Cannot connect to backend");
    }

    return Promise.reject(error);
  }
);

export default api;

export const procurementAPI = {
  // Authentication
  login: ({ username, password }) => {
  const form = new URLSearchParams();

  form.append("username", username);
  form.append("password", password);

  return api.post("/auth/login", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
},
  me: () => api.get("/auth/me"),

  // Dashboard
  getOverview: () => api.get("/dashboard/overview"),
  getRiskAnalysis: () => api.get("/dashboard/risk-analysis"),

  // Suppliers
  getSuppliers: () => api.get("/suppliers/"),
  getSupplierAnalytics: () => api.get("/suppliers/analytics"),
  getSupplierRanking: () => api.get("/suppliers/ranking"),
  compareSuppliers: () => api.get("/suppliers/compare"),
  getBestSupplier: () => api.get("/suppliers/best"),

  // Simulation
  simulate: (data) => api.post("/simulate", data),

  // AI Copilot
  copilot: (prompt) =>
    api.post("/copilot/", {
      prompt,
    }),

  // RAG
  ragChat: (query) =>
    api.post("/rag/chat", {
      query,
    }),

  // Search
  search: (query) =>
    api.post("/search/", {
      query,
    }),

  // Report
  downloadReport: () =>
    api.get("/report", {
      responseType: "blob",
    }),
};