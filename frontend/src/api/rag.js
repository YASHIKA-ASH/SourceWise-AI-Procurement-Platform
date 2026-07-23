import api from "./api.js";

export const askRag = (question) =>
  api.post("/rag/chat", {
    question,
  });