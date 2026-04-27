"use client";

import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { AlertTriangle, Clock, Coins, Hash } from "lucide-react";
import type { JudgeScore, RunResult } from "@/lib/types";
import { PROMPT_TEMPLATES } from "@/lib/prompts";

interface Props {
  result: RunResult;
  score?: JudgeScore;
  scoring?: boolean;
}

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export function ResultCard({ result, score, scoring }: Props) {
  const error = !!result.error;
  const totalTokens = result.promptTokens + result.completionTokens;

  return (
    <div
      className={clsx(
        "bg-bg-card border rounded-xl p-4 flex flex-col gap-3 min-h-[260px]",
        error ? "border-red-500/40" : "border-white/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-medium">
              {PROMPT_TEMPLATES[result.strategy].label}
            </span>
            <span className="text-slate-400">
              {PROVIDER_LABEL[result.provider]}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-slate-500">
            {result.model}
          </p>
        </div>

        <ScoreBadge score={score} scoring={scoring && !error} />
      </div>

      <div className="flex-1 overflow-y-auto max-h-72 scrollbar-thin pr-1">
        {error ? (
          <div className="flex items-start gap-2 text-sm text-red-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{result.error}</span>
          </div>
        ) : (
          <div className="markdown">
            <ReactMarkdown>{result.response}</ReactMarkdown>
          </div>
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
          <Stat
            icon={<Hash className="w-3 h-3" />}
            value={`${totalTokens} tok`}
            title={`${result.promptTokens} in / ${result.completionTokens} out`}
          />
          <Stat
            icon={<Coins className="w-3 h-3" />}
            value={`$${result.costUsd.toFixed(5)}`}
          />
          <Stat
            icon={<Clock className="w-3 h-3" />}
            value={`${result.latencyMs} ms`}
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  title,
}: {
  icon: React.ReactNode;
  value: string;
  title?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      {icon}
      <span className="font-mono">{value}</span>
    </span>
  );
}

function ScoreBadge({
  score,
  scoring,
}: {
  score?: JudgeScore;
  scoring?: boolean;
}) {
  if (scoring) {
    return (
      <div className="text-[10px] text-slate-500 animate-pulse">scoring…</div>
    );
  }
  if (!score) {
    return <div className="text-[10px] text-slate-600">unscored</div>;
  }
  const color =
    score.total >= 80
      ? "text-emerald-400 border-emerald-400/40"
      : score.total >= 60
        ? "text-amber-400 border-amber-400/40"
        : "text-red-400 border-red-400/40";
  return (
    <div
      title={`Correctness ${score.correctness}/40 · Clarity ${score.clarity}/30 · Completeness ${score.completeness}/30\n${score.rationale}`}
      className={clsx(
        "text-xs font-mono px-2 py-0.5 rounded border bg-black/20",
        color,
      )}
    >
      {score.total}/100
    </div>
  );
}
