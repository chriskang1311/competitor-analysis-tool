import { useState } from "react";
import EditableCell from "./EditableCell";
import { apiFetch } from "../lib/api";

export interface ComparisonTableData {
  features: string[];
  competitors: Array<{
    name: string;
    company: string;
    values: Record<string, string>;
  }>;
}

interface Props {
  table: ComparisonTableData;
  productId: string;
  onCellUpdate: (competitorName: string, feature: string, value: string) => void;
  onTableUpdate: (table: ComparisonTableData) => void;
  onResearchFeatures: (features: string[]) => void;
}

type ViewMode = "table" | "card";

function downloadCSV(table: ComparisonTableData, productName: string) {
  const headers = ["Feature", ...table.competitors.map(c => c.name)];
  const rows = table.features.map(f => [
    f,
    ...table.competitors.map(c => c.values[f] ?? "Unknown"),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${productName || "competitors"}-analysis.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ComparisonTable({
  table,
  productId,
  onCellUpdate,
  onTableUpdate,
  onResearchFeatures,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [newFeature, setNewFeature] = useState("");
  const [addingFeature, setAddingFeature] = useState(false);
  const [savingFeature, setSavingFeature] = useState(false);
  const [featureError, setFeatureError] = useState("");

  async function handleAddFeature() {
    if (!newFeature.trim()) return;
    setSavingFeature(true);
    setFeatureError("");
    try {
      const res = await apiFetch(`/products/${productId}/analysis/feature`, {
        method: "POST",
        body: JSON.stringify({ feature: newFeature.trim() }),
      });
      const body = await res.json();
      if (!res.ok || body.error) { setFeatureError(body.error ?? "Failed to add feature"); return; }
      onTableUpdate(body.data);
      setNewFeature("");
      setAddingFeature(false);
    } catch {
      setFeatureError("Failed to add feature");
    } finally {
      setSavingFeature(false);
    }
  }

  function handleResearchNewFeature() {
    if (!newFeature.trim()) return;
    onResearchFeatures([newFeature.trim()]);
    setNewFeature("");
    setAddingFeature(false);
  }

  return (
    <div className="comparison-table-section">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-view-toggle">
          <button
            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            ≡ Table
          </button>
          <button
            className={`view-btn ${viewMode === "card" ? "active" : ""}`}
            onClick={() => setViewMode("card")}
            title="Card view"
          >
            ⊞ Cards
          </button>
        </div>
        <div className="table-toolbar-actions">
          <button
            className="btn-secondary table-action-btn"
            onClick={() => downloadCSV(table, "")}
            title="Download as CSV"
          >
            ↓ Export CSV
          </button>
          <button
            className="btn-secondary table-action-btn"
            onClick={() => setAddingFeature(true)}
          >
            + Add Feature
          </button>
        </div>
      </div>

      {/* Add feature row */}
      {addingFeature && (
        <div className="add-feature-form">
          <input
            autoFocus
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            placeholder="e.g. Real-time Eligibility Verification"
            onKeyDown={e => { if (e.key === "Enter") handleAddFeature(); if (e.key === "Escape") { setAddingFeature(false); setNewFeature(""); } }}
            className="add-feature-input"
          />
          <div className="add-feature-actions">
            <button
              className="btn-secondary table-action-btn"
              onClick={handleAddFeature}
              disabled={!newFeature.trim() || savingFeature}
            >
              Add (Unknown)
            </button>
            <button
              className="btn-primary table-action-btn"
              onClick={handleResearchNewFeature}
              disabled={!newFeature.trim() || savingFeature}
              title="Add the feature and immediately research it with AI"
            >
              Add + Research
            </button>
            <button
              className="btn-secondary table-action-btn"
              onClick={() => { setAddingFeature(false); setNewFeature(""); setFeatureError(""); }}
            >
              Cancel
            </button>
          </div>
          {featureError && <div className="add-feature-error">{featureError}</div>}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="feature-col sticky-col">Feature</th>
                {table.competitors.map(c => (
                  <th key={c.name}>
                    <div className="table-competitor-name">{c.name}</div>
                    <div className="table-competitor-company">{c.company}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.features.map(feature => (
                <tr key={feature}>
                  <td className="feature-col feature-name sticky-col">{feature}</td>
                  {table.competitors.map(c => (
                    <td key={`${c.name}-${feature}`}>
                      <EditableCell
                        value={c.values[feature] ?? "Unknown"}
                        onChange={newVal => onCellUpdate(c.name, feature, newVal)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card view */}
      {viewMode === "card" && (
        <div className="card-view-grid">
          {table.competitors.map(c => (
            <div key={c.name} className="card-view-competitor">
              <div className="card-view-header">
                <div className="card-view-name">{c.name}</div>
                <div className="card-view-company">{c.company}</div>
              </div>
              <div className="card-view-features">
                {table.features.map(f => (
                  <div key={f} className="card-view-feature-row">
                    <span className="card-view-feature-label">{f}</span>
                    <EditableCell
                      value={c.values[f] ?? "Unknown"}
                      onChange={newVal => onCellUpdate(c.name, f, newVal)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
