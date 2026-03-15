import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSynthesisPrompt } from "../prompts.js";
import { SynthesisReportSchema } from "../schemas.js";
import type { ValidatedCompetitor, CompetitorAnalysis, SynthesisReport } from "../types.js";

export async function runSynthesis(
  productName: string,
  productDescription: string,
  category: string,
  competitorAnalyses: CompetitorAnalysis[],
  validatedCompetitors: ValidatedCompetitor[],
  onProgress?: (text: string) => void
): Promise<SynthesisReport> {
  const prompt = buildSynthesisPrompt(
    productName, productDescription, category,
    competitorAnalyses, validatedCompetitors
  );
  let resultText = "";

  for await (const event of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      maxTurns: 8,
      tools: [],
    },
  })) {
    if (event.type === "assistant" && onProgress) {
      onProgress(`✍️  Synthesizing report…`);
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  const clean = resultText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  return SynthesisReportSchema.parse(JSON.parse(clean));
}
