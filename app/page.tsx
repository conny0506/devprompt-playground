"use client";

import { useState } from "react";
import { Settings, Sparkles, Github, Zap } from "lucide-react";
import { PromptInput } from "@/components/PromptInput";
import { ResultsGrid } from "@/components/ResultsGrid";
import { SettingsModal } from "@/components/SettingsModal";
import { PromptTemplateViewer } from "@/components/PromptTemplateViewer";
import { ToastContainer } from "@/components/Toast";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/useToast";
import type {
  JudgeResponse,
  JudgeScore,
  PromptStrategy,
  ProviderId,
  RunResponse,
  RunResult,
} from "@/lib/types";

export default function Page() {
  const { keys, setKeys, hydrated } = useApiKeys();
  const { toasts, toast, remove: removeToast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [scores, setScores] = useState<Record<string, JudgeScore>>({});
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [lastProblem, setLastProblem] = useState("");

  const hasAnyKey = !!(keys.openai || keys.anthropic);

  async function handleRun(input: {
    problem: string;
    strategies: PromptStrategy[];
    providers: ProviderId[];
  }) {
    if (!hasAnyKey) {
      toast("No API keys found. Click 'Settings' to add them.", "error");
      setSettingsOpen(true);
      return;
    }

    setResults([]);
    setScores({});
    setLoading(true);
    setLastProblem(input.problem);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, keys }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as RunResponse;
      setResults(data.results);
      setLoading(false);

      const errCount = data.results.filter((r) => r.error).length;
      if (errCount > 0 && errCount < data.results.length) {
        toast(`${errCount} call(s) failed — see red cards for details.`, "error");
      } else if (errCount === data.results.length) {
        toast("All calls failed. Check your API keys in Settings.", "error");
        return;
      }

      const scorable = data.results.filter((r) => !r.error);
      if (scorable.length > 0) {
        scoreResults(input.problem, scorable);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast(msg, "error");
      setLoading(false);
    }
  }

  async function scoreResults(problem: string, items: RunResult[]) {
    setScoring(true);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problem,
          results: items.map((r) => ({
            id: r.id,
            strategy: r.strategy,
            provider: r.provider,
            response: r.response,
          })),
          keys,
        }),
      });
      if (!res.ok) throw new Error(`Judge failed (${res.status})`);
      const data = (await res.json()) as JudgeResponse;
      if (data.scores.length > 0) {
        const next: Record<string, JudgeScore> = {};
        for (const s of data.scores) next[s.id] = s;
        setScores(next);
        toast("Quality scores ready.", "success");
      }
    } catch {
      toast("Scoring unavailable — results still shown.", "info");
    } finally {
      setScoring(false);
    }
  }

  const showSkeleton = loading && results.length === 0;
  const showResults = results.length > 0;
  const showEmpty = !loading && !showResults;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                DevPrompt Playground
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Compare zero-shot · few-shot · chain-of-thought across OpenAI &
                Anthropic
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/conny0506/devprompt-playground"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-white/10 hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">
                {hasAnyKey ? "Keys configured" : "Add API keys"}
              </span>
            </button>
          </div>
        </header>

        {/* Key warning */}
        {hydrated && !hasAnyKey && (
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            No API keys yet.{" "}
            <button
              onClick={() => setSettingsOpen(true)}
              className="underline underline-offset-2"
            >
              Add them in Settings
            </button>{" "}
            — they&apos;re stored only in your browser, never on the server.
          </div>
        )}

        <PromptInput onRun={handleRun} loading={loading} />

        <PromptTemplateViewer />

        {/* Skeleton */}
        {showSkeleton && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-bg-card border border-white/5 rounded-xl p-4 min-h-[260px] animate-pulse"
              >
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-24 bg-white/5 rounded-full" />
                  <div className="h-5 w-16 bg-white/5 rounded-full" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                  <div className="h-3 bg-white/5 rounded w-4/6" />
                  <div className="h-3 bg-white/5 rounded w-5/6 mt-4" />
                  <div className="h-3 bg-white/5 rounded w-3/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && (
          <ResultsGrid results={results} scores={scores} scoring={scoring} />
        )}

        {showResults && lastProblem && (
          <p className="text-xs text-slate-500 text-center pt-2">
            {results.length} responses for:{" "}
            <span className="text-slate-400 italic">
              &ldquo;{lastProblem.slice(0, 90)}
              {lastProblem.length > 90 ? "…" : ""}&rdquo;
            </span>
          </p>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 text-slate-500">
            <Zap className="w-8 h-8 opacity-30" />
            <p className="text-sm">
              Enter a coding problem above and hit <strong className="text-slate-300">Run comparison</strong>.
            </p>
            <p className="text-xs">
              Results from up to 6 parallel calls will appear here.
            </p>
          </div>
        )}

        <footer className="pt-8 pb-4 text-center text-xs text-slate-600">
          BYOK · client-side keys · no server persistence · MIT
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={keys}
        onSave={setKeys}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}
