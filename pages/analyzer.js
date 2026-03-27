import { useState } from "react";

const validPairs = ["AUDUSD", "EURUSD", "GBPUSD", "NZDUSD"]; // Only pairs in backend pairMap

export default function Analyzer() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzeAll = async () => {
    setLoading(true);
    try {
      const queryPairs = validPairs.join(",");
      const res = await fetch(`/api/analyze?pairs=${queryPairs}&interval=1m`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setResults([{ pair: "ALL", signal: "ERROR", reasons: [err.message] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Quotex Pro Multi-Pair Analyzer</h1>
      <button
        onClick={analyzeAll}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze All Pairs"}
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left"
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Pair</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Signal</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Confidence</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Entry</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Expiry</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Reasons</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.pair}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.signal}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.confidence || "-"}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.entry || "-"}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{r.expiry || "-"}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {r.reasons ? r.reasons.join(", ") : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
          }
