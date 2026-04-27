"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { PromptStrategy, ProviderId } from "@/lib/types";
import { ALL_STRATEGIES, PROMPT_TEMPLATES } from "@/lib/prompts";

const ALL_PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
];

interface Props {
  onRun: (input: {
    problem: string;
    strategies: PromptStrategy[];
    providers: ProviderId[];
  }) => void;
  loading: boolean;
}

export function PromptInput({ onRun, loading }: Props) {
  const [problem, setProblem] = useState(
    "Write a Python function that returns the n-th Fibonacci number using memoization.",
  );
  const [strategies, setStrategies] = useState<PromptStrategy[]>([
    "zero-shot",
    "few-shot",
    "chain-of-thought",
  ]);
  const [providers, setProviders] = useState<ProviderId[]>([
    "openai",
    "anthropic",
  ]);

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const canRun =
    problem.trim().length > 0 &&
    strategies.length > 0 &&
    providers.length > 0 &&
    !loading;

  return (
    <div className="bg-bg-panel border border-white/5 rounded-xl p-5 space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Coding problem
        </label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={4}
          className="mt-2 w-full bg-bg-card border border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent resize-y"
          placeholder="Describe a coding problem..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
            Strategies
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_STRATEGIES.map((s) => (
              <Chip
                key={s}
                active={strategies.includes(s)}
                onClick={() => setStrategies((p) => toggle(p, s))}
                title={PROMPT_TEMPLATES[s].description}
              >
                {PROMPT_TEMPLATES[s].label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
            Providers
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_PROVIDERS.map((p) => (
              <Chip
                key={p.id}
                active={providers.includes(p.id)}
                onClick={() => setProviders((cur) => toggle(cur, p.id))}
              >
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          {strategies.length} × {providers.length} ={" "}
          <span className="text-slate-300 font-medium">
            {strategies.length * providers.length}
          </span>{" "}
          parallel calls
        </p>
        <button
          disabled={!canRun}
          onClick={() => onRun({ problem, strategies, providers })}
          className={clsx(
            "inline-flex items-center gap-2 px-5 py-2 rounded-md font-medium text-sm transition-colors",
            canRun
              ? "bg-accent hover:bg-accent-hover text-white"
              : "bg-white/5 text-slate-500 cursor-not-allowed",
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {loading ? "Running..." : "Run comparison"}
        </button>
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-accent/20 border-accent text-accent"
          : "bg-bg-card border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200",
      )}
    >
      {children}
    </button>
  );
}
