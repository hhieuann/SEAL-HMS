import { useState } from "react";
import api from "./api/client.js";

export default function App() {
  const [status, setStatus] = useState("not checked");

  async function ping() {
    try {
      // Example call; replace with a real endpoint later.
      await api.get("/api/v1/accounts/me");
      setStatus("backend reachable (got a response)");
    } catch (e) {
      setStatus("called backend — " + (e.response?.status ?? "no response"));
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>SEAL Hackathon Management System</h1>
      <p>Frontend skeleton is running.</p>
      <button onClick={ping}>Test backend connection</button>
      <p>Status: {status}</p>
    </main>
  );
}
