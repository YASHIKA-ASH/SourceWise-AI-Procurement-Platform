import { useState } from "react";
import { procurementAPI } from "../api/api";
import toast from "react-hot-toast";

export default function Copilot() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  async function handleSend() {
    if (!prompt.trim()) return;

    const userMessage = {
      role: "user",
      text: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);

      const res = await procurementAPI.copilot(prompt);

      const aiMessage = {
        role: "assistant",
        text:
          res.data.response ||
          res.data.answer ||
          res.data.message ||
          JSON.stringify(res.data, null, 2),
      };

      setMessages((prev) => [...prev, aiMessage]);

      setPrompt("");
    } catch (err) {
      console.error(err);
      toast.error("Copilot request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[85vh]">

      <h1 className="text-3xl font-bold mb-6">
        AI Procurement Copilot
      </h1>

      <div className="flex-1 bg-white rounded-xl shadow p-6 overflow-y-auto space-y-5">

        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            Ask anything about suppliers, procurement, risk or inventory.
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
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI Copilot..."
          className="flex-1 border rounded-lg p-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg"
        >
          {loading ? "Thinking..." : "Send"}
        </button>

      </div>

    </div>
  );
}