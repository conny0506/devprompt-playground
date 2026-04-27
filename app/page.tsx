"use client";

import { useState } from "react";
import { Settings, Sparkles, Github } from "lucide-react";
import { PromptInput } from "@/components/PromptInput";
import { ResultsGrid } from "@/components/ResultsGrid";
import { SettingsModal } from "@/components/SettingsModal";
import { PromptTemplateViewer } from "@/components/PromptTemplateViewer";
import { useApiKeys } from "@/hooks/useApiKeys";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [scores, setScores] = useState<Record<string, JudgeScore>>({});
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProblem, setLastProblem] = useState("");

  const hasAnyKey = !!(keys.openai || keys.anthropic);

  async function handleRun(input: {
    problem: string;
    strategies: PromptStrategy[];
    providers: ProviderId[];
  }) {
    setError(null);
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

      const scorable = data.results.filter((r) => !r.error);
      if (scorable.length > 0) {
        scoreResults(input.problem, scorable);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
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
      const next: Record<string, JudgeScore> = {};
      for (const s of data.scores) next[s.id] = s;
      setScores(next);
    } catch {
      /* non-fatal */
    } finally {
      setScoring(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">DevPrompt Playground</h1>
              <p className="text-xs text-slate-400">
                Compare prompt strategies across OpenAI and Anthropic.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/"
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
              <span>{hasAnyKey ? "Keys configured" : "Add API keys"}</span>
            </button>
          </div>
        </header>

        {hydrated && !hasAnyKey && (
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            No API keys yet. Click <strong>Add API keys</strong> — they&apos;re
            stored only in your browser. The server never persists them.
          </div>
        )}

        <PromptInput onRun={handleRun} loading={loading} />

        <PromptTemplateViewer />

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-bg-card border border-white/5 rounded-xl p-4 min-h-[260px] animate-pulse"
              >
                <div className="h-4 w-32 bg-white/5 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                  <div className="h-3 bg-white/5 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        <ResultsGrid results={results} scores={scores} scoring={scoring} />

        {results.length > 0 && lastProblem && (
          <p className="text-xs text-slate-500 text-center pt-2">
            Compared {results.length} responses for: &ldquo;{lastProblem.slice(0, 80)}
            {lastProblem.length > 80 ? "…" : ""}&rdquo;
          </p>
        )}

        <footer className="pt-8 pb-4 text-center text-xs text-slate-600">
          BYOK · client-side keys · no server persistence
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={keys}
        onSave={setKeys}
      />
    </main>
  );
}
