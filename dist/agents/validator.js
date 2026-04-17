import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildValidatorPrompt } from "../prompts.js";
import { ValidatorResultSchema } from "../schemas.js";
import { extractJson } from "../lib/extract-json.js";
import { withRetry } from "../lib/retry.js";
export async function runValidator(productName, category, competitors, onProgress, segment) {
    return withRetry(() => _runValidator(productName, category, competitors, onProgress, segment), 3, "Validator");
}
async function _runValidator(productName, category, competitors, onProgress, segment) {
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
            for (const block of event.message.content ?? []) {
                if (block.type === "tool_use" && onProgress) {
                    const input = block.input;
                    if (block.name === "WebSearch") {
                        onProgress(`🔍 Validating: ${input.query ?? ""}`);
                    }
                    else if (block.name === "WebFetch") {
                        try {
                            onProgress(`🌐 Checking: ${new URL(input.url ?? "").hostname}`);
                        }
                        catch {
                            onProgress(`🌐 Checking: ${input.url ?? ""}`);
                        }
                    }
                }
            }
        }
        else if (event.type === "result" && !event.is_error) {
            resultText = event.result ?? "";
        }
    }
    const parsed = ValidatorResultSchema.parse(JSON.parse(extractJson(resultText)));
    return parsed.competitors;
}
