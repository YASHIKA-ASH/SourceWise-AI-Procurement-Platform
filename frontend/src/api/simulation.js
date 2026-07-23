import api from "./api";

export const simulate = (data) =>
  api.post("/simulate", data);