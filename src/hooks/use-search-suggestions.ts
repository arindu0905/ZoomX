"use client";

import { useEffect, useState } from "react";
import type { SearchSuggestion } from "@/types/search";

type Status = "idle" | "loading" | "done" | "error";
type Settled = {
  query: string;
  status: "done" | "error";
  results: SearchSuggestion[];
};

/**
 * Debounced, abortable suggestions from /api/search. Only settled responses
 * are stored; "idle" and "loading" are derived from the current term.
 */
export function useSearchSuggestions(term: string, delay = 200): { status: Status; results: SearchSuggestion[] } {
  const [settled, setSettled] = useState<Settled | null>(null);
  const q = term.trim();

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: SearchSuggestion[] };
        setSettled({ query: q, status: "done", results: data.results });
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSettled({ query: q, status: "error", results: [] });
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, delay]);

  if (q.length < 2) return { status: "idle", results: [] };
  if (settled?.query !== q) return { status: "loading", results: settled?.results ?? [] };
  return settled;
}
