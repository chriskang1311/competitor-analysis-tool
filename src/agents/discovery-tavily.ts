import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildTavilyDiscoveryPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import { tavilyMultiSearch } from "../lib/tavily.js";
import type { CompetitorCard } from "../types.js";

export async function runTavilyDiscovery(
  productName: string,
  productDescription: string,
  category: string,
  onProgress?: (text: string) => void
): Promise<CompetitorCard[]> {
  onProgress?.(`[Tavily Agent] 🌐 Fetching search results…`);

  // Run 5 targeted searches from different angles
  const tavilyContext = await tavilyMultiSearch(
    [
      `top ${category} healthcare software vendors 2024 2025`,
      `${productName} alternatives competitors`,
      `best ${category} solutions KLAS ratings`,
      `${category} healthcare software G2 top rated`,
      `${productName} vs competitors comparison`,
    ],
    7
  );

  if (!tavilyContext) {
    onProgress?.(`[Tavily Agent] ⚠️  No results returned — agent will produce empty list`);
  } else {
    onProgress?.(`[Tavily Agent] ✅ Search results ready — extracting competitors…`);
  }

  const prompt = buildTavilyDiscoveryPrompt(
    productName,
    productDescription,
    category,
    tavilyContext
  );

  let resultText = "";

  // No web tools — agent reasons only over pre-fetched Tavily data
  for await (const event of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      maxTurns: 3,
      tools: [],
    },
  })) {
    if (event.type === "assistant" && onProgress) {
      onProgress(`[Tavily Agent] 🤔 Extracting competitors from search results…`);
    } else if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  onProgress?.(`[Tavily Agent] ✅ Done`);

  const clean = resultText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const parsed = DiscoveryResultSchema.parse(JSON.parse(clean));
  return parsed.competitors;
}
