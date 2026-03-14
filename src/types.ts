export interface SourceLink {
  url: string;
  description: string; // 1-4 word label, e.g. "G2 reviews" or "pricing page"
}

export interface CompetitorProfile {
  name: string;
  company: string;
  description: string;
  targetUser: string;
  sources: SourceLink[];
}

export interface AnalysisResult {
  productName: string;
  generatedAt: string;
  markdown: string;
}

export interface AnalysisEvent {
  type: "progress" | "result" | "error";
  text: string;
}
