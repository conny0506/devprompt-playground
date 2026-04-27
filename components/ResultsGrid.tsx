"use client";

import type { JudgeScore, RunResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";

interface Props {
  results: RunResult[];
  scores: Record<string, JudgeScore>;
  scoring: boolean;
}

export function ResultsGrid({ results, scores, scoring }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((r) => (
        <ResultCard
          key={r.id}
          result={r}
          score={scores[r.id]}
          scoring={scoring && !scores[r.id]}
        />
      ))}
    </div>
  );
}
