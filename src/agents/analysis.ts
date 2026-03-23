import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSingleCompetitorAnalysisPrompt, CATEGORY_FEATURE_HINTS } from "../prompts.js";
import { CompetitorAnalysisSchema } from "../schemas.js";
import { tavilyTieredSearch } from "../lib/tavily.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
import type { ValidatedCompetitor, CompetitorAnalysis } from "../types.js";

export async function runCompetitorAnalysis(
  productName: string,
  category: string,
  competitor: ValidatedCompetitor,
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorAnalysis> {
  return withRetry(
    () => _runAnalysis(productName, category, competitor, onProgress, segment),
    3,
    competitor.name
  );
}

async function _runAnalysis(
  productName: string,
  category: string,
  competitor: ValidatedCompetitor,
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorAnalysis> {
  const featureHints = CATEGORY_FEATURE_HINTS[category] ?? [];

  // Pre-fetch competitor-specific data with tiered Tavily search
  let tavilyContext: string | undefined;
  if (process.env.TAVILY_API_KEY) {
    onProgress?.(`[${competitor.name}] 🌐 Tavily pre-fetch…`);
    const currentYear = new Date().getFullYear();
    tavilyContext = await tavilyTieredSearch(
      // Tier 1 — recent news (last 90 days): funding, launches, leadership, partnerships
      [
        `${competitor.name} news ${currentYear}`,
        `${competitor.name} product launch funding acquisition ${currentYear}`,
      ],
      // Tier 2 — evergreen product info: features, reviews, pricing, integrations
      [
        `${competitor.name} ${category} features pricing`,
        `${competitor.name} G2 reviews healthcare`,
        `${competitor.name} integrations case study`,
      ]
    );
  }

  const prompt = buildSingleCompetitorAnalysisPrompt(productName, category, competitor, featureHints, tavilyContext, segment);
  let resultText = "";

  for await (const event of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      maxTurns: 20,
      tools: ["WebSearch", "WebFetch"],
      allowedTools: ["WebSearch", "WebFetch"],
    },
  })) {
    if (event.type === "assistant") {
      for (const block of (event.message as any).content ?? []) {
        if (block.type === "tool_use" && onProgress) {
          const input = block.input as Record<string, string>;
          if (block.name === "WebSearch") {
            onProgress(`[${competitor.name}] 🔍 ${input.query ?? ""}`);
          } else if (block.name === "WebFetch") {
            try { onProgress(`[${competitor.name}] 🌐 ${new URL(input.url ?? "").hostname}`); }
            catch { onProgress(`[${competitor.name}] 🌐 ${input.url ?? ""}`); }
          }
        }
      }
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  const analysis = CompetitorAnalysisSchema.parse(JSON.parse(extractJson(resultText)));

  // Compute evidence quality client-side (not asking LLM to self-report)
  const evidenceCount = analysis.evidence.length;
  const featureCount = featureHints.length || 1;
  const coverage = evidenceCount / featureCount;
  const searchCoverage: "full" | "partial" | "minimal" =
    coverage >= 0.7 ? "full" : coverage >= 0.3 ? "partial" : "minimal";

  return { ...analysis, evidenceCount, searchCoverage };
}

// Run multiple competitor analyses in parallel; partial failures are tolerated.
// If some agents fail, the successful results are returned and failures are logged.
export async function runAllAnalyses(
  productName: string,
  category: string,
  competitors: ValidatedCompetitor[],
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorAnalysis[]> {
  const results = await Promise.allSettled(
    competitors.map(c => runCompetitorAnalysis(productName, category, c, onProgress, segment))
  );

  const analyses: CompetitorAnalysis[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      analyses.push(r.value);
    } else {
      const name = competitors[i].name;
      console.warn(`\n⚠️  Analysis failed for ${name} after all retries — skipping. Error: ${r.reason}`);
      onProgress?.(`[${name}] ❌ Failed — skipped in report`);
    }
  }

  if (analyses.length === 0) {
    throw new Error("All competitor analyses failed. Cannot continue to synthesis.");
  }

  return analyses;
}
