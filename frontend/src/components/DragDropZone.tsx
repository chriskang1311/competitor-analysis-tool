import { useState } from "react";
import type { Competitor } from "./CompetitorCard";

interface Props {
  competitors: Competitor[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRunAnalysis: () => void;
  disabled: boolean;
}

export default function DragDropZone({
  competitors,
  selectedIds,
  onSelectionChange,
  onRunAnalysis,
  disabled,
}: Props) {
  const [dragOverZone, setDragOverZone] = useState<"available" | "selected" | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const available = competitors.filter(c => !selectedIds.includes(c.id));
  const selected = competitors.filter(c => selectedIds.includes(c.id));

  function addToSelected(id: string) {
    if (!selectedIds.includes(id)) onSelectionChange([...selectedIds, id]);
  }

  function removeFromSelected(id: string) {
    onSelectionChange(selectedIds.filter(sid => sid !== id));
  }

  function handleDrop(e: React.DragEvent, zone: "available" | "selected") {
    e.preventDefault();
    if (!dragId) return;
    if (zone === "selected") addToSelected(dragId);
    else removeFromSelected(dragId);
    setDragOverZone(null);
    setDragId(null);
  }

  return (
    <div className="drag-drop-zone">
      {/* Available column */}
      <div
        className={`drag-column ${dragOverZone === "available" ? "drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOverZone("available"); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={e => handleDrop(e, "available")}
      >
        <div className="drag-column-header">
          <span>Available Competitors</span>
          <span className="drag-count">{available.length}</span>
        </div>
        <div className="drag-column-items">
          {available.length === 0 ? (
            <div className="drag-empty">All competitors selected</div>
          ) : (
            available.map(c => (
              <div
                key={c.id}
                className="drag-card"
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => addToSelected(c.id)}
                title="Drag or click to select"
              >
                <div className="drag-card-name">{c.name}</div>
                <div className="drag-card-company">{c.company}</div>
                <span className="drag-card-add">+</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="drag-arrow">→</div>

      {/* Selected column */}
      <div
        className={`drag-column drag-column-selected ${dragOverZone === "selected" ? "drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOverZone("selected"); }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={e => handleDrop(e, "selected")}
      >
        <div className="drag-column-header">
          <span>Selected for Analysis</span>
          <span className="drag-count selected">{selected.length}</span>
        </div>
        <div className="drag-column-items">
          {selected.length === 0 ? (
            <div className="drag-empty">Drag competitors here or click to add</div>
          ) : (
            selected.map(c => (
              <div
                key={c.id}
                className="drag-card selected"
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => removeFromSelected(c.id)}
                title="Click to remove"
              >
                <div className="drag-card-name">{c.name}</div>
                <div className="drag-card-company">{c.company}</div>
                <span className="drag-card-remove">×</span>
              </div>
            ))
          )}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: "1rem", width: "100%" }}
          onClick={onRunAnalysis}
          disabled={disabled || selected.length === 0}
        >
          {selected.length === 0
            ? "Select competitors above"
            : `Run Deep Analysis (${selected.length} selected)`}
        </button>
      </div>
    </div>
  );
}
