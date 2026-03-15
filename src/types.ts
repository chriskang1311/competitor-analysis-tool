// ── Core competitor types ────────────────────────────────────────

export interface CompetitorCard {
  id: string;
  name: string;
  company: string;
  website: string;
  description: string;
  targetUser: string;
  keyStrength: string;
}

export interface ValidatedCompetitor extends CompetitorCard {
  confidence: "High" | "Medium" | "Low";
  validatorNotes: string;
  recommended: boolean;
  recommendationReason: string;
}

// ── Analysis types ───────────────────────────────────────────────

export interface Evidence {
  feature: string;
  claim: string;
  url: string;
}

export interface CompetitorAnalysis {
  id: string;
  name: string;
  company: string;
  values: Record<string, string>;
  evidence: Evidence[];
}

export interface ComparisonTable {
  features: string[];
  competitors: Array<{
    name: string;
    company: string;
    values: Record<string, string>;
  }>;
}

// ── Synthesis report ─────────────────────────────────────────────

export interface SynthesisReport {
  productName: string;
  category: string;
  generatedAt: string;
  executiveSummary: string[];
  topDifferentiators: Array<{ title: string; description: string }>;
  tableStakes: string[];
  whitespaceOpportunities: string[];
  comparisonTable: ComparisonTable;
  sources: Array<{ competitor: string; feature: string; claim: string; url: string }>;
}

// ── Session state ────────────────────────────────────────────────

export interface SessionState {
  productName: string;
  productDescription: string;
  category: string;
  slug: string;
  createdAt: string;
  phases: {
    discover?: "done" | "error";
    analyze?: "done" | "error";
  };
  selectedCompetitorIndices?: number[];
}

// ── Agent event (for console streaming) ─────────────────────────

export type AgentEvent =
  | { type: "progress"; text: string }
  | { type: "result"; data: unknown }
  | { type: "error"; text: string };
