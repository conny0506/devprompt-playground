import OpenAI from "openai";
import { PROVIDER_MODELS, calcCost } from "@/lib/pricing";
import { PROMPT_TEMPLATES } from "@/lib/prompts";
import type { PromptStrategy, RunResult } from "@/lib/types";

export async function runOpenAI(
  problem: string,
  strategy: PromptStrategy,
  apiKey: string,
): Promise<RunResult> {
  const client = new OpenAI({ apiKey });
  const model = PROVIDER_MODELS.openai;
  const built = PROMPT_TEMPLATES[strategy].build(problem);

  const start = Date.now();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: built.system },
      { role: "user", content: built.user },
    ],
    max_tokens: 1024,
    temperature: 0.2,
  });
  const latencyMs = Date.now() - start;

  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const response = completion.choices[0]?.message?.content ?? "";

  return {
    id: `${strategy}__openai`,
    strategy,
    provider: "openai",
    model,
    response,
    promptTokens,
    completionTokens,
    costUsd: calcCost(model, promptTokens, completionTokens),
    latencyMs,
  };
}
