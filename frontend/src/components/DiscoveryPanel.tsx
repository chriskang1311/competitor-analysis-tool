import { useState } from "react";
import CompetitorCard, { type Competitor } from "./CompetitorCard";
import { apiFetch } from "../lib/api";

interface Props {
  productId: string;
  competitors: Competitor[];
  updatedAt: string | null;
  onCompetitorAdded: (competitor: Competitor) => void;
  onCompetitorRemoved: (id: string) => void;
  onClearDiscovery: () => void;
}

export default function DiscoveryPanel({
  productId,
  competitors,
  updatedAt,
  onCompetitorAdded,
  onCompetitorRemoved,
  onClearDiscovery,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({
    name: "", company: "", website: "", description: "", targetUser: "", keyStrength: "",
  });

  function updateForm(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await apiFetch(`/products/${productId}/discover/competitor`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok || body.error) { setAddError(body.error ?? "Failed to add competitor"); return; }
      onCompetitorAdded(body.data);
      setForm({ name: "", company: "", website: "", description: "", targetUser: "", keyStrength: "" });
      setShowAddForm(false);
    } catch {
      setAddError("Failed to add competitor. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(id: string) {
    const res = await apiFetch(`/products/${productId}/discover/competitor/${id}`, { method: "DELETE" });
    if (res.ok) onCompetitorRemoved(id);
  }

  async function handleClear() {
    const res = await apiFetch(`/products/${productId}/discovery`, { method: "DELETE" });
    if (res.ok) { setShowClearConfirm(false); onClearDiscovery(); }
  }

  return (
    <div className="discovery-panel">
      <div className="discovery-panel-header">
        <div className="discovery-meta">
          <span className="discovery-count">
            <strong>{competitors.length}</strong> competitor{competitors.length !== 1 ? "s" : ""}
          </span>
          {updatedAt && (
            <span className="discovery-timestamp">
              Last run: {new Date(updatedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
              })}
            </span>
          )}
        </div>
        <div className="discovery-panel-actions">
          <button
            className="btn-secondary table-action-btn"
            onClick={() => setShowAddForm(v => !v)}
          >
            + Add Manually
          </button>
          <button
            className="btn-secondary table-action-btn danger-btn"
            onClick={() => setShowClearConfirm(true)}
            title="Clear all discovery results"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Add competitor form */}
      {showAddForm && (
        <div className="add-competitor-form card">
          <div className="add-competitor-form-header">
            <h4>Add Competitor Manually</h4>
            <button
              type="button"
              className="modal-close"
              onClick={() => { setShowAddForm(false); setAddError(""); }}
            >×</button>
          </div>
          <form onSubmit={handleAddCompetitor}>
            <div className="form-row">
              <div className="field">
                <label>Product Name *</label>
                <input value={form.name} onChange={e => updateForm("name", e.target.value)} required placeholder="e.g. Waystar" />
              </div>
              <div className="field">
                <label>Company *</label>
                <input value={form.company} onChange={e => updateForm("company", e.target.value)} required placeholder="e.g. Waystar Inc." />
              </div>
            </div>
            <div className="field">
              <label>Website</label>
              <input value={form.website} onChange={e => updateForm("website", e.target.value)} placeholder="https://waystar.com" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={e => updateForm("description", e.target.value)} placeholder="What does this product do?" rows={2} style={{ minHeight: "60px" }} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Target User</label>
                <input value={form.targetUser} onChange={e => updateForm("targetUser", e.target.value)} placeholder="Hospital billing teams" />
              </div>
              <div className="field">
                <label>Key Strength</label>
                <input value={form.keyStrength} onChange={e => updateForm("keyStrength", e.target.value)} placeholder="Best-in-class claim clearinghouse" />
              </div>
            </div>
            {addError && <div className="status-bar error" style={{ marginBottom: "0.5rem" }}>{addError}</div>}
            <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={addLoading}>
              {addLoading ? "Adding…" : "Add Competitor"}
            </button>
          </form>
        </div>
      )}

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.75rem" }}>Clear Discovery?</h3>
            <p style={{ color: "var(--gray-500)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              This will remove all {competitors.length} discovered competitors. Your comparison table will be kept.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary" style={{ background: "var(--red)", width: "auto" }} onClick={handleClear}>
                Yes, Clear
              </button>
              <button className="btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Competitor grid */}
      <div className="discovery-grid">
        {competitors.map(c => (
          <CompetitorCard
            key={c.id}
            competitor={c}
            onRemove={() => handleRemove(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
