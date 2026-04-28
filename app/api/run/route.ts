import { NextResponse } from "next/server";
import type { RunRequest, RunResponse, RunResult } from "@/lib/types";
import { PROMPT_TEMPLATES } from "@/lib/prompts";
import { PROVIDER_MODELS, calcCost } from "@/lib/pricing";
import { runOpenAI } from "@/lib/providers/openai";
import { runAnthropic } from "@/lib/providers/anthropic";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as RunRequest;
  const { problem, strategies, providers, keys } = body;

  if (!problem?.trim()) {
    return NextResponse.json({ error: "problem is required" }, { status: 400 });
  }

  const tasks: Promise<RunResult>[] = [];

  for (const strategy of strategies) {
    for (const provider of providers) {
      const key = provider === "openai" ? keys?.openai : keys?.anthropic;
      if (key) {
        tasks.push(callProvider(problem, strategy, provider, key));
      } else {
        tasks.push(Promise.resolve(missingKeyResult(strategy, provider)));
      }
    }
  }

  const settled = await Promise.allSettled(tasks);
  const results: RunResult[] = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    const strategy = strategies[Math.floor(i / providers.length)];
    const provider = providers[i % providers.length];
    return errorResult(strategy, provider, s.reason);
  });

  return NextResponse.json({ results } satisfies RunResponse);
}

async function callProvider(
  problem: string,
  strategy: RunRequest["strategies"][number],
  provider: RunRequest["providers"][number],
  apiKey: string,
): Promise<RunResult> {
  if (provider === "openai") return runOpenAI(problem, strategy, apiKey);
  return runAnthropic(problem, strategy, apiKey);
}

function missingKeyResult(
  strategy: RunRequest["strategies"][number],
  provider: RunRequest["providers"][number],
): RunResult {
  const model = PROVIDER_MODELS[provider];
  const built = PROMPT_TEMPLATES[strategy].build("(no problem)");
  const promptTokens = Math.round((built.system.length + built.user.length) / 4);
  return {
    id: `${strategy}__${provider}`,
    strategy,
    provider,
    model,
    response: "",
    promptTokens,
    completionTokens: 0,
    costUsd: calcCost(model, promptTokens, 0),
    latencyMs: 0,
    error: `No ${provider === "openai" ? "OpenAI" : "Anthropic"} API key. Add it in Settings.`,
  };
}

function errorResult(
  strategy: RunRequest["strategies"][number],
  provider: RunRequest["providers"][number],
  reason: unknown,
): RunResult {
  const model = PROVIDER_MODELS[provider];
  const message =
    reason instanceof Error ? reason.message : "Unexpected error";
  return {
    id: `${strategy}__${provider}`,
    strategy,
    provider,
    model,
    response: "",
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    latencyMs: 0,
    error: message,
  };
}
