import { useState } from "react";
import axios from "axios";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";

export default function Copilot() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  const ask = async () => {
    const res = await axios.post(
      "http://127.0.0.1:8000/copilot",
      {
        prompt,
      }
    );

    setAnswer(res.data.answer);
  };

  return (
    <Layout>
      <textarea
        rows={5}
        style={{ width: "100%" }}
        value={prompt}
        onChange={(e) =>
          setPrompt(e.target.value)
        }
      />

      <br />
      <br />

      <Button onClick={ask}>
        Ask AI
      </Button>

      <br />
      <br />

      <div>{answer}</div>
    </Layout>
  );
}