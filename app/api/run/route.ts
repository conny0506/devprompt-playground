import { NextResponse } from "next/server";
import type { RunRequest, RunResponse, RunResult } from "@/lib/types";
import { PROVIDER_MODELS, calcCost } from "@/lib/pricing";
import { PROMPT_TEMPLATES } from "@/lib/prompts";

export const runtime = "nodejs";

// Day 1: mock implementation. Day 2 swaps this for real OpenAI/Anthropic calls.
export async function POST(req: Request): Promise<NextResponse<RunResponse>> {
  const body = (await req.json()) as RunRequest;
  const { problem, strategies, providers } = body;

  const tasks: Promise<RunResult>[] = [];
  for (const strategy of strategies) {
    for (const provider of providers) {
      tasks.push(mockCall(problem, strategy, provider));
    }
  }
  const results = await Promise.all(tasks);
  return NextResponse.json({ results });
}

async function mockCall(
  problem: string,
  strategy: RunRequest["strategies"][number],
  provider: RunRequest["providers"][number],
): Promise<RunResult> {
  const start = Date.now();
  await sleep(400 + Math.random() * 1200);
  const latencyMs = Date.now() - start;

  const built = PROMPT_TEMPLATES[strategy].build(problem);
  const promptTokens = Math.round((built.system.length + built.user.length) / 4);
  const completionTokens = 80 + Math.floor(Math.random() * 220);
  const model = PROVIDER_MODELS[provider];

  const response = buildMockResponse(problem, strategy, provider);

  return {
    id: `${strategy}__${provider}`,
    strategy,
    provider,
    model,
    response,
    promptTokens,
    completionTokens,
    costUsd: calcCost(model, promptTokens, completionTokens),
    latencyMs,
  };
}

function buildMockResponse(
  problem: string,
  strategy: string,
  provider: string,
): string {
  const trimmed = problem.length > 60 ? problem.slice(0, 60) + "…" : problem;
  switch (strategy) {
    case "zero-shot":
      return `> _Mock ${provider} response for zero-shot._

\`\`\`python
def solution():
    # Direct attempt at: ${trimmed}
    pass
\`\`\`

Single-shot solution with no scaffolding.`;
    case "few-shot":
      return `> _Mock ${provider} response for few-shot._

\`\`\`python
def solution(n: int) -> int:
    # Style anchored by examples
    return n
\`\`\`

Solution mirrors the example format (typed signature, brief explanation).`;
    case "chain-of-thought":
      return `> _Mock ${provider} response for chain-of-thought._

**1. Restate.** ${trimmed}

**2. Edge cases.** empty input, negative n, very large n.

**3. Approach.** memoize results in a dict keyed by input.

**4. Implementation.**

\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

**5. Verify.** \`fib(0)=0\`, \`fib(1)=1\`, \`fib(10)=55\`. ✓`;
    default:
      return "Mock response.";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
