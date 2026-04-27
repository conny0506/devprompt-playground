export type PromptStrategy = "zero-shot" | "few-shot" | "chain-of-thought";
export type ProviderId = "openai" | "anthropic";

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
}

export interface RunRequest {
  problem: string;
  strategies: PromptStrategy[];
  providers: ProviderId[];
  keys: ApiKeys;
}

export interface RunResult {
  id: string;
  strategy: PromptStrategy;
  provider: ProviderId;
  model: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  error?: string;
}

export interface JudgeScore {
  id: string;
  correctness: number;
  clarity: number;
  completeness: number;
  total: number;
  rationale: string;
}

export interface RunResponse {
  results: RunResult[];
}

export interface JudgeRequest {
  problem: string;
  results: Array<Pick<RunResult, "id" | "strategy" | "provider" | "response">>;
  keys: ApiKeys;
}

export interface JudgeResponse {
  scores: JudgeScore[];
}
