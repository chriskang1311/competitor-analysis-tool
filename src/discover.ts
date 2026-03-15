import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildDiscoveryPrompt } from "./prompts.js";
import { DiscoveryResultSchema } from "./schemas.js";
import type { AnalysisEvent } from "./types.js";

export async function* runDiscovery(
  productName: string,
  productDescription: string,
  category: string
): AsyncGenerator<AnalysisEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const prompt = buildDiscoveryPrompt(productName, productDescription, category);

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["WebSearch", "WebFetch"],
      maxTurns: 20,
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
        // Strip markdown code fences if present
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonStr = fenceMatch[1];
        try {
          const parsed = DiscoveryResultSchema.parse(JSON.parse(jsonStr));
          yield { type: "result", text: "", data: parsed.competitors };
        } catch (e) {
          yield {
            type: "error",
            text: `Failed to parse competitor data: ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      } else {
        const errors =
          "errors" in message ? (message.errors as string[]).join("\n") : "Discovery failed";
        yield { type: "error", text: errors };
      }
    }
  }
}
