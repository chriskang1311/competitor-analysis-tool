import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildTavilyDiscoveryPrompt } from "../prompts.js";
import { DiscoveryResultSchema } from "../schemas.js";
import { tavilyTieredSearch } from "../lib/tavily.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
export async function runTavilyDiscovery(productName, productDescription, category, onProgress, segment) {
    return withRetry(() => _runTavilyDiscovery(productName, productDescription, category, onProgress, segment), 3, "Tavily Discovery");
}
async function _runTavilyDiscovery(productName, productDescription, category, onProgress, segment) {
    onProgress?.(`[Tavily Agent] 🌐 Fetching search results…`);
    const currentYear = new Date().getFullYear();
    // Tier 1 — recent news queries (will be filtered to last 90 days)
    const recentQueries = segment === "enterprise"
        ? [
            `${productName} enterprise competitor news ${currentYear}`,
            `${category} healthcare enterprise software acquisition funding ${currentYear}`,
            `${category} large vendor product launch announcement ${currentYear}`,
        ]
        : segment === "startup"
            ? [
                `${category} healthcare startup funding ${currentYear}`,
                `${productName} startup competitor news ${currentYear}`,
                `${category} healthcare new company launch ${currentYear}`,
            ]
            : [
                `${productName} competitor news ${currentYear}`,
                `${category} healthcare software company news ${currentYear}`,
                `${category} vendor product launch funding ${currentYear}`,
            ];
    // Tier 2 — evergreen product queries (no date filter — captures reviews, rankings, feature info)
    const evergreenQueries = segment === "enterprise"
        ? [
            `top ${category} healthcare enterprise software vendors`,
            `${productName} alternatives enterprise competitors`,
            `best ${category} solutions KLAS ratings large health systems`,
            `${category} healthcare software publicly traded companies`,
        ]
        : segment === "startup"
            ? [
                `${category} healthcare startup companies emerging`,
                `${productName} startup alternatives competitors`,
                `${category} healthcare software seed Series A Series B funded`,
                `new ${category} healthcare technology companies venture funded`,
            ]
            : [
                `top ${category} healthcare software vendors`,
                `${productName} alternatives competitors`,
                `best ${category} solutions KLAS ratings`,
                `${category} healthcare software G2 top rated`,
            ];
    // Run tiered searches — recent queries filtered to 90 days, evergreen unrestricted
    const tavilyContext = await tavilyTieredSearch(recentQueries, evergreenQueries, 6);
    if (!tavilyContext) {
        onProgress?.(`[Tavily Agent] ⚠️  No results returned — agent will produce empty list`);
    }
    else {
        onProgress?.(`[Tavily Agent] ✅ Search results ready — extracting competitors…`);
    }
    const prompt = buildTavilyDiscoveryPrompt(productName, productDescription, category, tavilyContext, segment);
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
        }
        else if (event.type === "result" && !event.is_error) {
            resultText = event.result ?? "";
        }
    }
    onProgress?.(`[Tavily Agent] ✅ Done`);
    const parsed = DiscoveryResultSchema.parse(JSON.parse(extractJson(resultText)));
    return parsed.competitors;
}
