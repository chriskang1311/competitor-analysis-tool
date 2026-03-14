import { useState } from "react";
import AnalysisForm from "./components/AnalysisForm";
import ResearchPhases from "./components/ResearchPhases";
import ReportView from "./components/ReportView";
import HistorySidebar from "./components/HistorySidebar";

export type Status = "idle" | "running" | "done" | "error";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function App() {
  // Form state
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [maxCompetitors, setMaxCompetitors] = useState(5);

  // Analysis state
  const [status, setStatus] = useState<Status>("idle");
  const [progressItems, setProgressItems] = useState<string[]>([]);
  const [report, setReport] = useState("");
  const [reportProductName, setReportProductName] = useState("");
  const [errorText, setErrorText] = useState("");

  // Sidebar/history state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  async function startAnalysis() {
    if (!productName.trim() || !productDescription.trim()) {
      alert("Please fill in both the product name and description.");
      return;
    }

    setStatus("running");
    setProgressItems(["Starting research…"]);
    setReport("");
    setErrorText("");
    setSelectedId(null);
    setReportProductName(productName);

    let buffer = "";

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productDescription, maxCompetitors }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;

          let event: { type: string; text: string };
          try { event = JSON.parse(payload); } catch { continue; }

          if (event.type === "progress") {
            setProgressItems((prev) => {
              const truncated = event.text.length > 150
                ? event.text.slice(0, 147) + "…"
                : event.text;
              return [...prev, truncated];
            });
          } else if (event.type === "result") {
            setReport(event.text);
            setStatus("done");
            setSidebarRefresh((n) => n + 1); // refresh sidebar
          } else if (event.type === "error") {
            setErrorText(event.text);
            setStatus("error");
          }
        }
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function loadAnalysis(id: string) {
    setSelectedId(id);
    setStatus("idle");
    setProgressItems([]);
    setErrorText("");
    setReport("");

    try {
      const res = await fetch(`${API_URL}/analyses/${id}`);
      const { data } = await res.json();
      if (data) {
        setReport(data.report_markdown);
        setReportProductName(data.product_name);
        setStatus("done");
      }
    } catch {
      // silently ignore
    }
  }

  function handleNewAnalysis() {
    setSelectedId(null);
    setStatus("idle");
    setReport("");
    setProgressItems([]);
    setErrorText("");
  }

  return (
    <div className="app-layout">
      <HistorySidebar
        selectedId={selectedId}
        onSelect={loadAnalysis}
        onNewAnalysis={handleNewAnalysis}
        refreshTrigger={sidebarRefresh}
      />

      <div className="app-main">
        <header className="app-header">
          <h1>Competitor Analysis Tool</h1>
          <p>AI-powered competitive research for healthcare products</p>
        </header>

        <main>
          {(status === "idle" || status === "running" || status === "error") && (
            <div className="card">
              <AnalysisForm
                productName={productName}
                productDescription={productDescription}
                maxCompetitors={maxCompetitors}
                onProductNameChange={setProductName}
                onProductDescriptionChange={setProductDescription}
                onMaxCompetitorsChange={setMaxCompetitors}
                onSubmit={startAnalysis}
                disabled={status === "running"}
              />

              {status === "running" && (
                <div className="progress-section">
                  <div className="status-bar running">
                    <div className="spinner" />
                    <span>Researching competitors — this takes 5–10 minutes…</span>
                  </div>
                  <ResearchPhases items={progressItems} />
                </div>
              )}

              {status === "error" && (
                <div className="status-bar error" style={{ marginTop: "1rem" }}>
                  <strong>Error:</strong>&nbsp;{errorText}
                </div>
              )}
            </div>
          )}

          {status === "done" && report && (
            <>
              {selectedId === null && (
                <button className="btn-secondary back-btn" onClick={handleNewAnalysis}>
                  ← New Analysis
                </button>
              )}
              <ReportView productName={reportProductName} report={report} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
