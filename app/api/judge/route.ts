import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { JudgeRequest, JudgeResponse, JudgeScore } from "@/lib/types";

export const runtime = "nodejs";

const JUDGE_SYSTEM = `You are a senior software engineer reviewing AI-generated code responses.
Score each response on three rubrics:
- correctness (0–40): Is the code logically correct and does it solve the problem?
- clarity (0–30): Is the code readable, well-named, and easy to follow?
- completeness (0–30): Does it handle edge cases and provide a useful explanation?

Return ONLY a valid JSON object with this exact shape, no prose:
{
  "scores": [
    {
      "id": "<id from input>",
      "correctness": <number 0-40>,
      "clarity": <number 0-30>,
      "completeness": <number 0-30>,
      "rationale": "<one sentence>"
    }
  ]
}`;

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as JudgeRequest;
  const { problem, results, keys } = body;

  const scorable = results.filter((r) => r.response?.trim());
  if (scorable.length === 0) {
    return NextResponse.json({ scores: [] } satisfies JudgeResponse);
  }

  const userContent = buildUserContent(problem, scorable);

  try {
    let raw: string;
    if (keys?.anthropic) {
      raw = await judgeWithAnthropic(keys.anthropic, userContent);
    } else if (keys?.openai) {
      raw = await judgeWithOpenAI(keys.openai, userContent);
    } else {
      return NextResponse.json({ scores: [] } satisfies JudgeResponse);
    }

    const parsed = extractJson(raw) as { scores: JudgeScore[] };
    const scores: JudgeScore[] = (parsed.scores ?? []).map((s) => ({
      ...s,
      total: (s.correctness ?? 0) + (s.clarity ?? 0) + (s.completeness ?? 0),
    }));
    return NextResponse.json({ scores } satisfies JudgeResponse);
  } catch {
    return NextResponse.json({ scores: [] } satisfies JudgeResponse);
  }
}

function buildUserContent(
  problem: string,
  items: JudgeRequest["results"],
): string {
  const entries = items
    .map(
      (r) =>
        `### Response ID: ${r.id}\nStrategy: ${r.strategy} | Provider: ${r.provider}\n\n${r.response}`,
    )
    .join("\n\n---\n\n");
  return `Problem statement:\n${problem}\n\n---\n\n${entries}`;
}

async function judgeWithAnthropic(
  apiKey: string,
  userContent: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    // prompt caching — cache_control is a beta field not yet in the SDK types
    system: [{ type: "text", text: JUDGE_SYSTEM, cache_control: { type: "ephemeral" } }] as never,
    messages: [{ role: "user", content: userContent }],
  });
  const block = msg.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}

async function judgeWithOpenAI(
  apiKey: string,
  userContent: string,
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in judge response");
  return JSON.parse(match[0]);
}
