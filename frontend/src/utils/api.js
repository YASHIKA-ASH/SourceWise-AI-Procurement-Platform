import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
  "Content-Type": "application/json"
}
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Unauthorized. Please log in.')
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  }
)

export const procurementAPI = {
  simulate: (data) => api.post("/simulate", data),

  getOverview: () => api.get("/dashboard/overview"),

  getRiskAnalysis: () => api.get("/dashboard/risk-analysis"),

  getSuppliers: () => api.get("/suppliers/"),

  getSupplierAnalytics: () =>
    api.get("/suppliers/analytics"),

  downloadReport: () =>
    api.get("/report", {
      responseType: "blob",
    }),

  compareSuppliers: () =>
    api.get("/suppliers/compare"),

  getRanking: () =>
    api.get("/suppliers/ranking"),
};