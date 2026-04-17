import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSynthesisPrompt } from "../prompts.js";
import { SynthesisReportSchema } from "../schemas.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
export async function runSynthesis(productName, productDescription, category, competitorAnalyses, validatedCompetitors, onProgress, segment) {
    return withRetry(() => _runSynthesis(productName, productDescription, category, competitorAnalyses, validatedCompetitors, onProgress, segment), 3, "Synthesis");
}
async function _runSynthesis(productName, productDescription, category, competitorAnalyses, validatedCompetitors, onProgress, segment) {
    const prompt = buildSynthesisPrompt(productName, productDescription, category, competitorAnalyses, validatedCompetitors, segment);
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
        }
        else if (event.type === "result" && !event.is_error) {
            resultText = event.result ?? "";
        }
    }
    const report = SynthesisReportSchema.parse(JSON.parse(extractJson(resultText)));
    // Validate completeness — warn if the report looks thin
    if (report.executiveSummary.length < 4) {
        throw new Error(`Synthesis produced only ${report.executiveSummary.length} executive summary sentences (need ≥4) — retrying`);
    }
    if (report.comparisonTable.competitors.length === 0) {
        throw new Error("Synthesis produced an empty comparison table — retrying");
    }
    return report;
}
