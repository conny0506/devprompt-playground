"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import clsx from "clsx";

export type ToastType = "error" | "success" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface Props {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  const Icon =
    item.type === "error"
      ? AlertTriangle
      : item.type === "success"
        ? CheckCircle
        : Info;

  return (
    <div
      className={clsx(
        "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        item.type === "error"
          ? "bg-red-950/90 border-red-500/40 text-red-100"
          : item.type === "success"
            ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
            : "bg-bg-panel border-white/10 text-slate-100",
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="text-sm flex-1">{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="p-0.5 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
