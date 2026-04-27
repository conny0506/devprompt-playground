"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileCode } from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/prompts";
import type { PromptStrategy } from "@/lib/types";

const PLACEHOLDER = "{problem}";

export function PromptTemplateViewer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PromptStrategy>("zero-shot");

  const built = PROMPT_TEMPLATES[active].build(PLACEHOLDER);

  return (
    <div className="bg-bg-panel border border-white/5 rounded-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-white/[0.02]"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <FileCode className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium">View prompt templates</span>
        <span className="text-xs text-slate-500 ml-auto">
          single source of truth: lib/prompts.ts
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PROMPT_TEMPLATES) as PromptStrategy[]).map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  active === s
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-bg-card border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                {PROMPT_TEMPLATES[s].label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            {PROMPT_TEMPLATES[active].description}
          </p>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
              system
            </p>
            <pre className="text-xs font-mono bg-black/40 border border-white/5 rounded p-3 whitespace-pre-wrap text-slate-200">
              {built.system}
            </pre>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
              user
            </p>
            <pre className="text-xs font-mono bg-black/40 border border-white/5 rounded p-3 whitespace-pre-wrap text-slate-200">
              {built.user}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
