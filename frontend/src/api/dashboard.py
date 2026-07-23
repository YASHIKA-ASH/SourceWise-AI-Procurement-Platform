import api from "./api";

export const getOverview = () =>
  api.get("/dashboard/overview");

export const getRiskAnalysis = () =>
  api.get("/dashboard/risk-analysis");