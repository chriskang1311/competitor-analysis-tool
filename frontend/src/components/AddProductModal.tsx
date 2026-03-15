import { useState } from "react";
import { apiFetch } from "../lib/api";

interface Props {
  category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreated: (product: any) => void;
  onClose: () => void;
}

export default function AddProductModal({ category, onCreated, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({ category, name, description }),
      });
      const body = await res.json();
      if (!res.ok || body.error) { setError(body.error ?? `Server error: ${res.status}`); return; }
      onCreated(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Product</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Product Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Epic Resolute"
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              placeholder="What does this product do? Who uses it?"
            />
          </div>
          {error && (
            <div className="status-bar error" style={{ marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
