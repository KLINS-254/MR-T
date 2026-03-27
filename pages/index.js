import { useState } from "react";

export default function Home() {
  const [pairs, setPairs] = useState("AUDUSDT,USDJPY,EURUSDT"); // default pairs
  const [interval, setInterval] = useState("1m"); // default timeframe
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzePairs = async () => {
    setLoading(true);
    try {
      // Encode user input for API query
      const query = `pairs=${encodeURIComponent(pairs)}&interval=${interval}`;
      const res = await fetch(`/api/analyze?${query}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setResults([{ pair: "ERROR", signal: err.message, reasons: [] }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h2>Quotex Pro Multi-Pair Analyzer</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Pairs (comma-separated): </label>
        <input
          type="text"
          value={pairs}
          onChange={(e) => setPairs(e.target.value.toUpperCase())}
          style={{ width: "300px", marginRight: "1rem" }}
        />

        <label>Interval: </label>
        <select value={interval} onChange={(e) => setInterval(e.target.value)}>
          <option value="1m">1 Minute</option>
          <option value="5m">5 Minutes</option>
          <option value="15m">15 Minutes</option>
          <option value="30m">30 Minutes</option>
          <option value="1h">1 Hour</option>
        </select>
      </div>

      <button onClick={analyzePairs} style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}>
        Analyze Selected Pairs
      </button>

      {loading && <p>Analyzing pairs...</p>}

      <pre>
        {results.map(d => `
Pair: ${d.pair} (${d.interval})
Signal: ${d.signal}
Confidence: ${d.confidence || "-"}%
Entry: ${d.entry || "-"}
Expiry: ${d.expiry || "-"}
Reasons: ${d.reasons.join(", ")}
        `).join("\n")}
      </pre>
    </div>
  );
}
