import api from "./api";

export const askAI = (prompt) =>
  api.post("/copilot", { prompt });