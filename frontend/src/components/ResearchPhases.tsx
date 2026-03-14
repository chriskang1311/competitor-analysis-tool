import { useEffect, useRef } from "react";

interface Props {
  items: string[];
}

type Phase = 1 | 2 | 3;

function detectPhase(items: string[]): Phase {
  if (items.length === 0) return 1;
  // Phase 3: writing the report (markdown headings appearing in text blocks)
  const lastFew = items.slice(-5).join(" ");
  if (lastFew.includes("##") || lastFew.toLowerCase().includes("section")) return 3;
  // Phase 2: deep research (fetching specific competitor pages)
  if (items.length >= 5) return 2;
  return 1;
}

const PHASES = [
  { num: 1, label: "Finding Competitors" },
  { num: 2, label: "Researching Features" },
  { num: 3, label: "Writing Report" },
];

export default function ResearchPhases({ items }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const currentPhase = detectPhase(items);

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
      {/* Phase step indicator */}
      <div className="phase-steps">
        {PHASES.map((phase, idx) => {
          const isDone = currentPhase > phase.num;
          const isActive = currentPhase === phase.num;
          return (
            <div key={phase.num} className="phase-step-wrapper">
              <div className={`phase-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                <div className="phase-circle">
                  {isDone ? "✓" : phase.num}
                </div>
                <span className="phase-label">{phase.label}</span>
              </div>
              {idx < PHASES.length - 1 && (
                <div className={`phase-connector ${isDone || isActive ? "lit" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Activity log */}
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
