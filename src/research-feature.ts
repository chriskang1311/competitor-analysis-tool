import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildFeatureResearchPrompt } from "./prompts.js";
import { ComparisonTableSchema } from "./schemas.js";
import type { AnalysisEvent } from "./types.js";

export async function* runFeatureResearch(
  productName: string,
  productDescription: string,
  category: string,
  featuresToResearch: string[],
  competitors: Array<{ name: string; website: string; company: string }>
): AsyncGenerator<AnalysisEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const prompt = buildFeatureResearchPrompt(
    productName,
    productDescription,
    category,
    featuresToResearch,
    competitors
  );

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["WebSearch", "WebFetch"],
      maxTurns: 15,
      model: "claude-sonnet-4-6",
    },
  })) {
    if (message.type === "assistant") {
      const blocks = message.message.content as Array<{
        type: string;
        text?: string;
        name?: string;
        input?: Record<string, unknown>;
      }>;
      for (const block of blocks) {
        if (block.type === "text" && block.text?.trim()) {
          yield { type: "progress", text: block.text };
        } else if (block.type === "tool_use") {
          if (block.name === "WebSearch" && block.input?.query) {
            yield { type: "progress", text: `🔍 Searching: "${block.input.query}"` };
          } else if (block.name === "WebFetch" && block.input?.url) {
            try {
              const hostname = new URL(String(block.input.url)).hostname;
              yield { type: "progress", text: `📄 Fetching: ${hostname}` };
            } catch {
              yield { type: "progress", text: `📄 Fetching: ${block.input.url}` };
            }
          }
        }
      }
    } else if (message.type === "result") {
      if (message.subtype === "success") {
        let jsonStr = message.result;
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonStr = fenceMatch[1];
        try {
          const parsed = ComparisonTableSchema.parse(JSON.parse(jsonStr));
          yield { type: "result", text: "", data: parsed };
        } catch (e) {
          yield {
            type: "error",
            text: `Failed to parse feature research: ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      } else {
        const errors =
          "errors" in message ? (message.errors as string[]).join("\n") : "Research failed";
        yield { type: "error", text: errors };
      }
    }
  }
}
