import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildDiscoveryPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import type { CompetitorCard } from "../types.js";

export async function runDiscovery(
  productName: string,
  productDescription: string,
  category: string,
  onProgress?: (text: string) => void
): Promise<CompetitorCard[]> {
  const prompt = buildDiscoveryPrompt(productName, productDescription, category);
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
            onProgress(`🔍 Searching: ${input.query ?? ""}`);
          } else if (block.name === "WebFetch") {
            try { onProgress(`🌐 Fetching: ${new URL(input.url ?? "").hostname}`); }
            catch { onProgress(`🌐 Fetching: ${input.url ?? ""}`); }
          }
        }
      }
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  const clean = resultText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const parsed = DiscoveryResultSchema.parse(JSON.parse(clean));
  return parsed.competitors;
}
