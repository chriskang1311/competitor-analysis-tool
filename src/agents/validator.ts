import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildValidatorPrompt } from "../prompts.js";
import { ValidatorResultSchema } from "../schemas.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
import type { CompetitorCard, ValidatedCompetitor } from "../types.js";

export async function runValidator(
  productName: string,
  category: string,
  competitors: CompetitorCard[],
  onProgress?: (text: string) => void,
  segment?: string
): Promise<ValidatedCompetitor[]> {
  return withRetry(
    () => _runValidator(productName, category, competitors, onProgress, segment),
    3,
    "Validator"
  );
}

async function _runValidator(
  productName: string,
  category: string,
  competitors: CompetitorCard[],
  onProgress?: (text: string) => void,
  segment?: string
): Promise<ValidatedCompetitor[]> {
  const prompt = buildValidatorPrompt(productName, category, competitors, segment);
  let resultText = "";

  for await (const event of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      maxTurns: 10,
      tools: ["WebSearch", "WebFetch"],
      allowedTools: ["WebSearch", "WebFetch"],
    },
  })) {
    if (event.type === "assistant") {
      for (const block of (event.message as any).content ?? []) {
        if (block.type === "tool_use" && onProgress) {
          const input = block.input as Record<string, string>;
          if (block.name === "WebSearch") {
            onProgress(`🔍 Validating: ${input.query ?? ""}`);
          } else if (block.name === "WebFetch") {
            try { onProgress(`🌐 Checking: ${new URL(input.url ?? "").hostname}`); }
            catch { onProgress(`🌐 Checking: ${input.url ?? ""}`); }
          }
        }
      }
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  const parsed = ValidatorResultSchema.parse(JSON.parse(extractJson(resultText)));
  return parsed.competitors;
}
