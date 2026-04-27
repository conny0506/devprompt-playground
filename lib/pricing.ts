import type { ProviderId } from "./types";

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export const PROVIDER_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

export const PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": {
    inputPer1M: 0.15,
    outputPer1M: 0.6,
  },
  "claude-haiku-4-5-20251001": {
    inputPer1M: 1.0,
    outputPer1M: 5.0,
  },
};

export function calcCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (
    (promptTokens / 1_000_000) * p.inputPer1M +
    (completionTokens / 1_000_000) * p.outputPer1M
  );
}
