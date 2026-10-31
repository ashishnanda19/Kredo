"use client";

import { useCallback, useEffect, useState } from "react";

export type DemoState = "loading" | "ready" | "error" | "empty";

/**
 * Simulates a data fetch: "loading" for a moment, then "ready".
 * Append ?demo=error or ?demo=empty to any dashboard URL to preview those states.
 * `retry()` re-runs the fake load.
 */
export function useDemoState(delay = 900): { state: DemoState; retry: () => void } {
  const [state, setState] = useState<DemoState>("loading");
  const [run, setRun] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const param = new URLSearchParams(window.location.search).get("demo");
      // a retry after the forced error recovers, so the error state is dismissible
      if (run === 0 && param === "error") setState("error");
      else if (param === "empty") setState("empty");
      else setState("ready");
    }, delay);
    return () => clearTimeout(t);
  }, [delay, run]);

  const retry = useCallback(() => {
    setState("loading");
    setRun((r) => r + 1);
  }, []);

  return { state, retry };
}

/** Brief fake load so every list shows its skeleton before its content (mock data is instant). */
export function useFakeLoad(ms = 500): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return ready;
}
