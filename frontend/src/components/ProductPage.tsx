import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import DiscoveryPanel from "./DiscoveryPanel";
import DragDropZone from "./DragDropZone";
import ComparisonTable, { type ComparisonTableData } from "./ComparisonTable";
import ResearchPhases from "./ResearchPhases";
import type { Competitor } from "./CompetitorCard";

interface Props {
  productId: string;
  productName: string;
  productDescription: string;
  onBack: () => void;
  onJobStart: (productId: string, productName: string, type: "discovery" | "analysis") => void;
  onJobEnd: (productId: string) => void;
  onProductUpdated: (id: string, name: string, description: string) => void;
  onProductDeleted: (id: string) => void;
}

type RunPhase = "idle" | "running-discovery" | "discovery-done" | "running-analysis" | "running-feature-research" | "analysis-done" | "error";

export default function ProductPage({
  productId,
  productName,
  productDescription,
  onBack,
  onJobStart,
  onJobEnd,
  onProductUpdated,
  onProductDeleted,
}: Props) {
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressItems, setProgressItems] = useState<string[]>([]);
  const [table, setTable] = useState<ComparisonTableData | null>(null);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(true);
  const [discoveryUpdatedAt, setDiscoveryUpdatedAt] = useState<string | null>(null);
  const [analysisUpdatedAt, setAnalysisUpdatedAt] = useState<string | null>(null);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState(false);
  const [editName, setEditName] = useState(productName);
  const [editDesc, setEditDesc] = useState(productDescription);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete product state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Feature research state
  const [researchingFeatures, setResearchingFeatures] = useState<string[]>([]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadProduct();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [productId]);

  async function loadProduct() {
    try {
      const res = await apiFetch(`/products/${productId}`);
      const { data } = await res.json();
      if (!data) return;

      if (data.competitors?.length) setCompetitors(data.competitors);
      if (data.discovery_updated_at) setDiscoveryUpdatedAt(data.discovery_updated_at);

      if (data.analysis?.comparison_table) {
        setTable(data.analysis.comparison_table);
        setSelectedIds(data.analysis.selected_competitor_ids ?? []);
        setAnalysisUpdatedAt(data.analysis_updated_at);
      }

      // Determine phase from DB status
      if (data.analysis_status === "running") {
        setPhase("running-analysis");
        onJobStart(productId, productName, "analysis");
        startPolling();
      } else if (data.discovery_status === "running") {
        setPhase("running-discovery");
        onJobStart(productId, productName, "discovery");
        startPolling();
      } else if (data.analysis?.comparison_table) {
        setPhase("analysis-done");
      } else if (data.competitors?.length) {
        setPhase("discovery-done");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/products/${productId}`);
        const { data } = await res.json();
        if (!data) return;

        if (data.discovery_status === "done" && phase === "running-discovery") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setCompetitors(data.competitors ?? []);
          setDiscoveryUpdatedAt(data.discovery_updated_at);
          setPhase("discovery-done");
          setProgressItems([]);
          onJobEnd(productId);
        } else if (data.analysis_status === "done" && (phase === "running-analysis" || phase === "running-feature-research")) {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          if (data.analysis?.comparison_table) {
            setTable(data.analysis.comparison_table);
            setAnalysisUpdatedAt(data.analysis_updated_at);
          }
          setPhase("analysis-done");
          setProgressItems([]);
          onJobEnd(productId);
        } else if (data.discovery_status === "error" || data.analysis_status === "error") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setErrorText(data.discovery_error ?? data.analysis_error ?? "An error occurred");
          setPhase("error");
          onJobEnd(productId);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
  }

  async function startDiscovery() {
    setPhase("running-discovery");
    setProgressItems(["Starting competitor discovery…"]);
    setCompetitors([]);
    setErrorText("");
    onJobStart(productId, productName, "discovery");
    let buffer = "";
    try {
      const response = await apiFetch(`/products/${productId}/discover`, {
        method: "POST", body: JSON.stringify({}),
      });
      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);
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
          let event: { type: string; text: string; data?: unknown };
          try { event = JSON.parse(payload); } catch { continue; }
          if (event.type === "progress") {
            setProgressItems(prev => [...prev, event.text.slice(0, 150)]);
          } else if (event.type === "result" && event.data) {
            setCompetitors(event.data as Competitor[]);
            setPhase("discovery-done");
            onJobEnd(productId);
          } else if (event.type === "error") {
            setErrorText(event.text);
            setPhase("error");
            onJobEnd(productId);
          }
        }
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : String(err));
      setPhase("error");
      onJobEnd(productId);
      startPolling(); // fall back to polling if SSE drops
    }
  }

  async function startAnalysis() {
    if (!selectedIds.length) return;
    setPhase("running-analysis");
    setProgressItems(["Starting deep analysis…"]);
    setTable(null);
    setErrorText("");
    onJobStart(productId, productName, "analysis");
    let buffer = "";
    try {
      const response = await apiFetch(`/products/${productId}/analyze`, {
        method: "POST",
        body: JSON.stringify({ selectedCompetitorIds: selectedIds }),
      });
      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);
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
          let event: { type: string; text: string; data?: unknown };
          try { event = JSON.parse(payload); } catch { continue; }
          if (event.type === "progress") {
            setProgressItems(prev => [...prev, event.text.slice(0, 150)]);
          } else if (event.type === "result" && event.data) {
            setTable(event.data as ComparisonTableData);
            setPhase("analysis-done");
            onJobEnd(productId);
          } else if (event.type === "error") {
            setErrorText(event.text);
            setPhase("error");
            onJobEnd(productId);
          }
        }
      }
    } catch (err) {
      // If SSE drops (user navigated away and came back), fall back to polling
      setErrorText("");
      startPolling();
    }
  }

  async function handleResearchFeatures(features: string[]) {
    setResearchingFeatures(features);
    setPhase("running-feature-research");
    setProgressItems([`Researching: ${features.join(", ")}…`]);
    onJobStart(productId, productName, "analysis");
    let buffer = "";
    try {
      const response = await apiFetch(`/products/${productId}/analysis/research-feature`, {
        method: "POST",
        body: JSON.stringify({ features }),
      });
      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);
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
          let event: { type: string; text: string; data?: unknown };
          try { event = JSON.parse(payload); } catch { continue; }
          if (event.type === "progress") {
            setProgressItems(prev => [...prev, event.text.slice(0, 150)]);
          } else if (event.type === "result" && event.data) {
            setTable(event.data as ComparisonTableData);
            setPhase("analysis-done");
            onJobEnd(productId);
          } else if (event.type === "error") {
            setErrorText(event.text);
            setPhase("error");
            onJobEnd(productId);
          }
        }
      }
    } catch {
      startPolling();
    } finally {
      setResearchingFeatures([]);
    }
  }

  async function handleSaveProduct() {
    setEditSaving(true);
    setEditError("");
    try {
      const res = await apiFetch(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      const body = await res.json();
      if (!res.ok || body.error) { setEditError(body.error ?? "Failed to save"); return; }
      setEditingProduct(false);
      onProductUpdated(productId, editName, editDesc);
    } catch {
      setEditError("Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteProduct() {
    const res = await apiFetch(`/products/${productId}`, { method: "DELETE" });
    if (res.ok) { onProductDeleted(productId); onBack(); }
  }

  async function updateCell(competitorName: string, feature: string, value: string) {
    await apiFetch(`/products/${productId}/analysis`, {
      method: "PATCH",
      body: JSON.stringify({ competitorName, feature, value }),
    });
  }

  const isRunning = phase === "running-discovery" || phase === "running-analysis" || phase === "running-feature-research";
  const showAnalysisSection = phase !== "idle" && phase !== "running-discovery" && phase !== "error" || competitors.length > 0;

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-page-loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      {/* Header */}
      <div className="product-page-header">
        <button className="btn-secondary back-btn" onClick={onBack}>← Back</button>

        {editingProduct ? (
          <div className="product-edit-form">
            <input
              className="product-edit-name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoFocus
            />
            <input
              className="product-edit-desc"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Description"
            />
            {editError && <span className="product-edit-error">{editError}</span>}
            <button className="btn-primary" style={{ width: "auto" }} onClick={handleSaveProduct} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" onClick={() => { setEditingProduct(false); setEditName(productName); setEditDesc(productDescription); }}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="product-page-title-row">
            <h2 className="product-page-title">{productName}</h2>
            <button className="icon-btn" onClick={() => setEditingProduct(true)} title="Edit product">✏️</button>
            <button className="icon-btn danger-icon-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete product">🗑️</button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.75rem" }}>Delete "{productName}"?</h3>
            <p style={{ color: "var(--gray-500)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              This will permanently delete this product and all its discovery and analysis data. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary" style={{ background: "var(--red)", width: "auto" }} onClick={handleDeleteProduct}>
                Delete
              </button>
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="product-page-content">
        {/* Step 1: Competitor Discovery */}
        <section className="product-section card">
          <div className="section-heading">
            <h3>Step 1: Competitor Discovery</h3>
            <p className="hint">Find the top competitors in this space.</p>
          </div>

          {!isRunning && (
            <button
              className="btn-primary"
              style={{ width: "auto" }}
              onClick={startDiscovery}
            >
              {competitors.length > 0 ? "Re-run Discovery" : "Find Competitors"}
            </button>
          )}

          {phase === "running-discovery" && (
            <div className="progress-section">
              <div className="status-bar running">
                <div className="spinner" />
                <span>Searching for competitors — 3–5 minutes. You can navigate away and come back.</span>
              </div>
              <ResearchPhases
                items={progressItems}
                phases={["Searching", "Fetching Pages", "Compiling Results"]}
              />
            </div>
          )}

          {phase === "error" && (
            <div className="status-bar error" style={{ marginTop: "0.75rem" }}>
              <strong>Error:</strong>&nbsp;{errorText}
            </div>
          )}

          {competitors.length > 0 && (
            <DiscoveryPanel
              productId={productId}
              competitors={competitors}
              updatedAt={discoveryUpdatedAt}
              onCompetitorAdded={c => setCompetitors(prev => [...prev, c])}
              onCompetitorRemoved={id => setCompetitors(prev => prev.filter(c => c.id !== id))}
              onClearDiscovery={() => { setCompetitors([]); setPhase("idle"); }}
            />
          )}
        </section>

        {/* Step 2: Deep Analysis */}
        {showAnalysisSection && competitors.length > 0 && (
          <section className="product-section card">
            <div className="section-heading">
              <h3>Step 2: Deep Analysis</h3>
              <p className="hint">Select competitors by dragging, then run deep analysis to build the comparison table.</p>
            </div>

            {phase !== "running-analysis" && phase !== "running-feature-research" && (
              <DragDropZone
                competitors={competitors}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRunAnalysis={startAnalysis}
                disabled={false}
              />
            )}

            {(phase === "running-analysis" || phase === "running-feature-research") && (
              <div className="progress-section">
                <div className="status-bar running">
                  <div className="spinner" />
                  <span>
                    {phase === "running-feature-research"
                      ? `Researching: ${researchingFeatures.join(", ")}…`
                      : "Running deep analysis — 5–10 minutes. You can navigate away and come back."
                    }
                  </span>
                </div>
                <ResearchPhases
                  items={progressItems}
                  phases={phase === "running-feature-research"
                    ? ["Researching Features", "Compiling Results"]
                    : ["Researching Features", "Comparing Products", "Structuring Results"]}
                />
              </div>
            )}

            {table && (
              <div className="table-section">
                <div className="table-section-header">
                  <h4>Comparison Table</h4>
                  {analysisUpdatedAt && (
                    <span className="hint">
                      Updated {new Date(analysisUpdatedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                      {" · "}Click any cell to edit
                    </span>
                  )}
                </div>
                <ComparisonTable
                  table={table}
                  productId={productId}
                  onCellUpdate={updateCell}
                  onTableUpdate={setTable}
                  onResearchFeatures={handleResearchFeatures}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
