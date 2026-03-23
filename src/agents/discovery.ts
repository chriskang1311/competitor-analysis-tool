import { runClaudeDiscovery } from "./discovery-claude.js";
import { runTavilyDiscovery } from "./discovery-tavily.js";
import { runConsensus } from "./discovery-consensus.js";
import type { CompetitorCard } from "../types.js";

export async function runDiscovery(
  productName: string,
  productDescription: string,
  category: string,
  onProgress?: (text: string) => void,
  segment?: string
): Promise<CompetitorCard[]> {
  const hasTavily = !!process.env.TAVILY_API_KEY;

  if (!hasTavily) {
    // No Tavily key — fall back to single Claude WebSearch agent
    onProgress?.(`⚠️  TAVILY_API_KEY not set — running single-agent discovery`);
    return runClaudeDiscovery(productName, productDescription, category, onProgress, segment);
  }

  // Run both agents in parallel — they work independently
  onProgress?.(`🚀 Starting parallel discovery: Claude WebSearch Agent + Tavily Agent`);

  const [claudeList, tavilyList] = await Promise.all([
    runClaudeDiscovery(productName, productDescription, category, onProgress, segment),
    runTavilyDiscovery(productName, productDescription, category, onProgress, segment),
  ]);

  onProgress?.(`\n🤝 Both agents finished — starting Consensus Agent`);

  // Consensus agent reconciles the two lists into a final top 10
  return runConsensus(productName, category, claudeList, tavilyList, onProgress, segment);
}
