import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildConsensusPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import { extractJson } from "../lib/extract-json.js";
export async function runConsensus(productName, category, claudeList, tavilyList, onProgress, segment) {
    // Log what the two agents found before consensus
    const claudeNames = new Set(claudeList.map(c => c.name.toLowerCase()));
    const tavilyNames = new Set(tavilyList.map(c => c.name.toLowerCase()));
    const overlapCount = claudeList.filter(c => tavilyNames.has(c.name.toLowerCase())).length;
    onProgress?.(`[Consensus Agent] 📊 Claude found ${claudeList.length}, Tavily found ${tavilyList.length} — ${overlapCount} overlap`);
    onProgress?.(`[Consensus Agent] 🤝 Reconciling lists into final top 10…`);
    const prompt = buildConsensusPrompt(productName, category, claudeList, tavilyList, segment);
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
        if (event.type === "result" && !event.is_error) {
            resultText = event.result ?? "";
        }
    }
    onProgress?.(`[Consensus Agent] ✅ Final list agreed`);
    const parsed = DiscoveryResultSchema.parse(JSON.parse(extractJson(resultText)));
    return parsed.competitors;
}
