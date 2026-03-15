import { useEffect, useRef } from "react";

interface Props {
  items: string[];
  phases?: string[];
}

const DEFAULT_PHASES = ["Finding Competitors", "Researching Features", "Writing Report"];

function detectPhase(items: string[], totalPhases: number): number {
  if (items.length === 0) return 1;
  const lastFew = items.slice(-5).join(" ");
  if (lastFew.includes("##") || lastFew.toLowerCase().includes("section")) return totalPhases;
  if (items.length >= 5) return Math.min(2, totalPhases);
  return 1;
}

export default function ResearchPhases({ items, phases = DEFAULT_PHASES }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const currentPhase = detectPhase(items, phases.length);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [items]);

  function itemClass(text: string): string {
    if (text.startsWith("🔍")) return "log-item log-search";
    if (text.startsWith("📄")) return "log-item log-fetch";
    return "log-item log-text";
  }

  return (
    <div className="research-phases">
      <div className="phase-steps">
        {phases.map((label, idx) => {
          const num = idx + 1;
          const isDone = currentPhase > num;
          const isActive = currentPhase === num;
          return (
            <div key={label} className="phase-step-wrapper">
              <div className={`phase-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                <div className="phase-circle">{isDone ? "✓" : num}</div>
                <span className="phase-label">{label}</span>
              </div>
              {idx < phases.length - 1 && (
                <div className={`phase-connector ${isDone || isActive ? "lit" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="activity-log" ref={logRef}>
        {items.map((item, i) => (
          <div key={i} className={itemClass(item)}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
