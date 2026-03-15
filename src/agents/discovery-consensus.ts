import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildConsensusPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import type { CompetitorCard } from "../types.js";

export async function runConsensus(
  productName: string,
  category: string,
  claudeList: CompetitorCard[],
  tavilyList: CompetitorCard[],
  onProgress?: (text: string) => void
): Promise<CompetitorCard[]> {
  // Log what the two agents found before consensus
  const claudeNames = new Set(claudeList.map(c => c.name.toLowerCase()));
  const tavilyNames = new Set(tavilyList.map(c => c.name.toLowerCase()));
  const overlapCount = claudeList.filter(c => tavilyNames.has(c.name.toLowerCase())).length;

  onProgress?.(`[Consensus Agent] 📊 Claude found ${claudeList.length}, Tavily found ${tavilyList.length} — ${overlapCount} overlap`);
  onProgress?.(`[Consensus Agent] 🤝 Reconciling lists into final top 10…`);

  const prompt = buildConsensusPrompt(productName, category, claudeList, tavilyList);
  let resultText = "";

  // No web tools — consensus is a pure reasoning task over the two lists
  for await (const event of query({
    prompt,
    options: {
      model: "claude-sonnet-4-6",
      maxTurns: 3,
      tools: [],
    },
  })) {
    if (event.type === "result" && !(event as any).is_error) {
      resultText = (event as any).result ?? "";
    }
  }

  onProgress?.(`[Consensus Agent] ✅ Final list agreed`);

  const clean = resultText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const parsed = DiscoveryResultSchema.parse(JSON.parse(clean));
  return parsed.competitors;
}
