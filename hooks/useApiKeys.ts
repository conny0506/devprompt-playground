"use client";

import { useEffect, useState } from "react";
import type { ApiKeys } from "@/lib/types";

const STORAGE_KEY = "dpp_api_keys_v1";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setKeys(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = (next: ApiKeys) => {
    setKeys(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const clear = () => {
    setKeys({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return { keys, setKeys: update, clear, hydrated };
}
