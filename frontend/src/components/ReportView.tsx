import { useMemo, useRef } from "react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";

interface Props {
  productName: string;
  report: string;
}

interface Section {
  id: string;
  label: string;
}

function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      const label = match[1].trim();
      const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      sections.push({ id, label });
    }
  }
  return sections;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ReportView({ productName, report }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => parseSections(report), [report]);

  function scrollToSection(id: string) {
    const el = reportRef.current?.querySelector(`#${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyReport() {
    navigator.clipboard.writeText(report).then(() => alert("Report copied to clipboard!"));
  }

  function downloadReport() {
    const slug = productName.toLowerCase().replace(/\s+/g, "-") || "analysis";
    const blob = new Blob([report], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}-competitor-analysis.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const components: Components = {
    h2({ children, ...props }) {
      const text = typeof children === "string" ? children : String(children);
      const id = slugify(text);
      return <h2 id={id} {...props}>{children}</h2>;
    },
    table({ children, ...props }) {
      return (
        <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
          <table {...props}>{children}</table>
        </div>
      );
    },
  };

  return (
    <div className="card report-card">
      <div className="output-toolbar">
        <h2>{productName} — Competitor Analysis</h2>
        <div className="toolbar-actions">
          <button className="btn-secondary" onClick={copyReport}>Copy</button>
          <button className="btn-secondary" onClick={downloadReport}>Download .md</button>
        </div>
      </div>

      {sections.length > 0 && (
        <nav className="section-nav">
          {sections.map((s) => (
            <button key={s.id} className="section-nav-pill" onClick={() => scrollToSection(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      )}

      <div className="report-container" ref={reportRef}>
        <Markdown components={components}>{report}</Markdown>
      </div>
    </div>
  );
}
