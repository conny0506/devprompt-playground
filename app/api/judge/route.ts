import { NextResponse } from "next/server";
import type { JudgeRequest, JudgeResponse, JudgeScore } from "@/lib/types";

export const runtime = "nodejs";

// Day 1: mock implementation. Day 2 swaps this for a real judge LLM call.
export async function POST(req: Request): Promise<NextResponse<JudgeResponse>> {
  const body = (await req.json()) as JudgeRequest;

  await sleep(900);

  const scores: JudgeScore[] = body.results.map((r) => {
    const seed = hash(r.id);
    const correctness = 24 + (seed % 17); // 24..40
    const clarity = 18 + ((seed >> 4) % 13); // 18..30
    const completeness = 16 + ((seed >> 8) % 15); // 16..30
    return {
      id: r.id,
      correctness,
      clarity,
      completeness,
      total: correctness + clarity + completeness,
      rationale: `Mock judge: ${r.strategy} via ${r.provider} produced a coherent answer.`,
    };
  });

  return NextResponse.json({ scores });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
