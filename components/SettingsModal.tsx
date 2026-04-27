"use client";

import { useEffect, useState } from "react";
import { X, KeyRound, Eye, EyeOff } from "lucide-react";
import type { ApiKeys } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export function SettingsModal({ open, onClose, keys, onSave }: Props) {
  const [openai, setOpenai] = useState(keys.openai ?? "");
  const [anthropic, setAnthropic] = useState(keys.anthropic ?? "");
  const [revealOpenai, setRevealOpenai] = useState(false);
  const [revealAnthropic, setRevealAnthropic] = useState(false);

  useEffect(() => {
    if (open) {
      setOpenai(keys.openai ?? "");
      setAnthropic(keys.anthropic ?? "");
    }
  }, [open, keys]);

  if (!open) return null;

  const save = () => {
    onSave({
      openai: openai.trim() || undefined,
      anthropic: anthropic.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-bg-panel border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">API Keys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs text-slate-400">
            Keys are stored in your browser&apos;s localStorage and sent only with
            the request body. The server never persists or logs them.
          </p>

          <KeyField
            label="OpenAI API Key"
            placeholder="sk-..."
            value={openai}
            onChange={setOpenai}
            reveal={revealOpenai}
            onToggleReveal={() => setRevealOpenai((v) => !v)}
          />
          <KeyField
            label="Anthropic API Key"
            placeholder="sk-ant-..."
            value={anthropic}
            onChange={setAnthropic}
            reveal={revealAnthropic}
            onToggleReveal={() => setRevealAnthropic((v) => !v)}
          />
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-md bg-accent hover:bg-accent-hover text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface KeyFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  reveal: boolean;
  onToggleReveal: () => void;
}

function KeyField({
  label,
  placeholder,
  value,
  onChange,
  reveal,
  onToggleReveal,
}: KeyFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="mt-1 relative">
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-10 px-3 py-2 bg-bg-card border border-white/10 rounded-md text-sm font-mono focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
          aria-label={reveal ? "Hide" : "Show"}
        >
          {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}
