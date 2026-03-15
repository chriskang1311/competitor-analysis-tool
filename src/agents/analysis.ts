import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSingleCompetitorAnalysisPrompt, CATEGORY_FEATURE_HINTS } from "../prompts.js";
import { CompetitorAnalysisSchema } from "../schemas.js";
import type { ValidatedCompetitor, CompetitorAnalysis } from "../types.js";

export async function runCompetitorAnalysis(
  productName: string,
  category: string,
  competitor: ValidatedCompetitor,
  onProgress?: (text: string) => void
): Promise<CompetitorAnalysis> {
  const featureHints = CATEGORY_FEATURE_HINTS[category] ?? [];
  const prompt = buildSingleCompetitorAnalysisPrompt(productName, category, competitor, featureHints);
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

  const clean = resultText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  return CompetitorAnalysisSchema.parse(JSON.parse(clean));
}

// Run multiple competitor analyses in parallel
export async function runAllAnalyses(
  productName: string,
  category: string,
  competitors: ValidatedCompetitor[],
  onProgress?: (text: string) => void
): Promise<CompetitorAnalysis[]> {
  return Promise.all(
    competitors.map(c => runCompetitorAnalysis(productName, category, c, onProgress))
  );
}
