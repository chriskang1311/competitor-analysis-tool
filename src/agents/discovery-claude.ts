import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildDiscoveryPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
import type { CompetitorCard } from "../types.js";

// Claude WebSearch agent — finds competitors independently with no Tavily seeding.
// Intentionally uses no pre-fetched data so its results are fully independent
// from the Tavily agent, enabling a meaningful consensus step.
export async function runClaudeDiscovery(
  productName: string,
  productDescription: string,
  category: string,
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorCard[]> {
  return withRetry(
    () => _runClaudeDiscovery(productName, productDescription, category, onProgress, segment),
    3,
    "Claude Discovery"
  );
}

async function _runClaudeDiscovery(
  productName: string,
  productDescription: string,
  category: string,
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorCard[]> {
  // No tavilyContext passed — agent searches from scratch
  const prompt = buildDiscoveryPrompt(productName, productDescription, category, undefined, segment);
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
            onProgress(`[Claude Agent] 🔍 ${input.query ?? ""}`);
          } else if (block.name === "WebFetch") {
            try { onProgress(`[Claude Agent] 🌐 ${new URL(input.url ?? "").hostname}`); }
            catch { onProgress(`[Claude Agent] 🌐 ${input.url ?? ""}`); }
          }
        }
      }
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  onProgress?.(`[Claude Agent] ✅ Done`);

  const parsed = DiscoveryResultSchema.parse(JSON.parse(extractJson(resultText)));
  return parsed.competitors;
}
