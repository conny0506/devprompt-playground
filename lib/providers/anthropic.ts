import Anthropic from "@anthropic-ai/sdk";
import { PROVIDER_MODELS, calcCost } from "@/lib/pricing";
import { PROMPT_TEMPLATES } from "@/lib/prompts";
import type { PromptStrategy, RunResult } from "@/lib/types";

export async function runAnthropic(
  problem: string,
  strategy: PromptStrategy,
  apiKey: string,
): Promise<RunResult> {
  const client = new Anthropic({ apiKey });
  const model = PROVIDER_MODELS.anthropic;
  const built = PROMPT_TEMPLATES[strategy].build(problem);

  const start = Date.now();
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    // prompt caching — cache_control is a beta field not yet in the SDK types
    system: [{ type: "text", text: built.system, cache_control: { type: "ephemeral" } }] as never,
    messages: [{ role: "user", content: built.user }],
  });
  const latencyMs = Date.now() - start;

  const usage = message.usage as {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };

  const promptTokens = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0);
  const completionTokens = usage.output_tokens;

  const textContent = message.content.find((b) => b.type === "text");
  const response = textContent?.type === "text" ? textContent.text : "";

  return {
    id: `${strategy}__anthropic`,
    strategy,
    provider: "anthropic",
    model,
    response,
    promptTokens,
    completionTokens,
    costUsd: calcCost(model, promptTokens, completionTokens),
    latencyMs,
  };
}
