import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface AnalysisSummary {
  id: string;
  product_name: string;
  created_at: string;
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  refreshTrigger: number;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(items: AnalysisSummary[]): Map<string, AnalysisSummary[]> {
  const groups = new Map<string, AnalysisSummary[]>();
  for (const item of items) {
    const label = formatDate(item.created_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return groups;
}

export default function HistorySidebar({ selectedId, onSelect, onNewAnalysis, refreshTrigger }: Props) {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/analyses`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (Array.isArray(data)) setAnalyses(data);
      })
      .catch(() => {});
  }, [refreshTrigger]);

  const groups = groupByDate(analyses);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Past Analyses</span>
        <button className="sidebar-new-btn" onClick={onNewAnalysis}>+ New</button>
      </div>

      <div className="sidebar-list">
        {analyses.length === 0 ? (
          <p className="sidebar-empty">No analyses yet</p>
        ) : (
          Array.from(groups.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel} className="sidebar-group">
              <p className="sidebar-date">{dateLabel}</p>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-item ${selectedId === item.id ? "active" : ""}`}
                  onClick={() => onSelect(item.id)}
                  title={item.product_name}
                >
                  <span className="sidebar-dot">●</span>
                  <span className="sidebar-name">{item.product_name}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
