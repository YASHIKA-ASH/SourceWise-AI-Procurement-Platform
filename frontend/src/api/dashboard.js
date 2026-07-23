import api from "./api";

export const getDashboard = () =>
  api.get("/dashboard");

export const getAnalytics = () =>
  api.get("/suppliers/analytics");

export const getInventory = () =>
  api.get("/inventory");

export const getPayments = () =>
  api.get("/payments");