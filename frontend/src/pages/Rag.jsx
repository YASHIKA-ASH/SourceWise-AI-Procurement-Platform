import { useState } from "react";
import { procurementAPI } from "../api/api";
import toast from "react-hot-toast";

export default function Rag() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  async function handleSend() {
    if (!query.trim()) return;

    const userMessage = {
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);

      const res = await procurementAPI.ragChat(query);

      const aiMessage = {
        role: "assistant",
        text:
          res.data.answer ||
          res.data.response ||
          res.data.message ||
          JSON.stringify(res.data, null, 2),
      };

      setMessages((prev) => [...prev, aiMessage]);

      setQuery("");
    } catch (err) {
      console.error(err);
      toast.error("RAG request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[85vh]">

      <h1 className="text-3xl font-bold mb-6">
        RAG Knowledge Assistant
      </h1>

      <div className="flex-1 bg-white rounded-xl shadow p-6 overflow-y-auto space-y-5">

        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            Ask questions about procurement policies, suppliers or uploaded
            documents.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-xl px-5 py-3 whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

      </div>

      <div className="flex gap-3 mt-5">

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask the RAG Assistant..."
          className="flex-1 border rounded-lg p-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-lg"
        >
          {loading ? "Searching..." : "Ask"}
        </button>

      </div>

    </div>
  );
}
