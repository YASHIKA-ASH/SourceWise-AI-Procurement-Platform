import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { askRag } from "../api/rag";

export default function Rag() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);

  const submit = async () => {
    const res = await askRag(question);
    setResult(res.data);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div
        style={{
          marginLeft: 270,
          width: "100%",
          padding: 30,
        }}
      >
        <h1>Knowledge Base</h1>

        <textarea
          rows={6}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: "100%",
            padding: 15,
          }}
        />

        <br />
        <br />

        <button onClick={submit}>
          Search Knowledge Base
        </button>

        {result && (
          <div
            style={{
              marginTop: 30,
              background: "#131C2E",
              padding: 20,
              color: "white",
              borderRadius: 10,
            }}
          >
            <h3>Answer</h3>

            <p>{result.answer}</p>

            <h4>
              Confidence: {result.confidence}%
            </h4>
          </div>
        )}
      </div>
    </div>
  );
}