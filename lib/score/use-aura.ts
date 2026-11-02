"use client";

import { useCallback, useEffect, useState } from "react";
import { useHydrated, useStore } from "@/lib/store/store";
import { chooseFixture, mockAura, mockHistory, mockWhatIf } from "./mock";
import type { AuraHistoryView, AuraView, HistoryResponse, MeResponse, Source, Status, WhatIfResponse, WhatIfView } from "./types";

/**
 * Client hooks for Aura. Each asks the BFF first; `{source: "mock"}` means SCORE_API_URL is unset, so the mock
 * adapter answers from the demo state. Live views are kept per browser as the "last known Aura" for when the
 * service is unreachable (a convenience only: it can be empty, and nothing depends on it).
 */
const LAST_KEY = "kredo-aura-last";
const REFRESH = "aura:refresh";

export function refreshAura() {
  window.dispatchEvent(new Event(REFRESH));
}

function useRefreshKey() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const bump = () => setKey((k) => k + 1);
    window.addEventListener(REFRESH, bump);
    return () => window.removeEventListener(REFRESH, bump);
  }, []);
  return key;
}

function saveLast(view: AuraView) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(view));
  } catch {
    /* storage unavailable: no last-known fallback, which is fine */
  }
}

function readLast(): AuraView | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as AuraView) : null;
  } catch {
    return null;
  }
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** The mock fixture the demo state points at (ignored in live mode). */
function useChoice() {
  return useStore((s) => chooseFixture(s));
}

export interface AuraResult {
  status: Status;
  view: AuraView | null;
  source: Source | null;
}

export function useAura(): AuraResult {
  const hydrated = useHydrated();
  const choice = useChoice();
  const key = useRefreshKey();
  const [result, setResult] = useState<AuraResult>({ status: "loading", view: null, source: null });

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    (async () => {
      const me = await getJson<MeResponse>("/api/score/me");
      let next: AuraResult;
      if (me?.source === "mock") next = { ...(await mockAura(choice)), source: "mock" };
      else if (me?.status === "ok" && me.view) {
        saveLast(me.view);
        next = { status: "ok", view: me.view, source: "live" };
      } else if (!me || me.status === "unavailable") next = { status: "unavailable", view: readLast(), source: "live" };
      else next = { status: me.status, view: null, source: "live" };
      if (alive) setResult(next);
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, choice, key]);

  return result;
}

export function useAuraHistory(days: number): { status: Status; history: AuraHistoryView | null } {
  const hydrated = useHydrated();
  const choice = useChoice();
  const key = useRefreshKey();
  const request = `${choice}:${days}:${key}`;
  // a result belongs to the request that produced it; until the current one answers, the hook reports loading
  const [result, setResult] = useState<{ request: string; status: Status; history: AuraHistoryView | null } | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    (async () => {
      const res = await getJson<HistoryResponse>(`/api/score/history?days=${days}`);
      let next: { status: Status; history: AuraHistoryView | null };
      if (res?.source === "mock") {
        const history = await mockHistory(choice, days);
        next = { status: history ? "ok" : choice === "unavailable" ? "unavailable" : "no_score", history };
      } else if (!res) next = { status: "unavailable", history: null };
      else next = { status: res.status, history: res.history };
      if (alive) setResult({ request: `${choice}:${days}:${key}`, ...next });
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, choice, days, key]);

  return result?.request === request ? result : { status: "loading", history: result?.history ?? null };
}

export type WhatIfResult = { status: "idle" | "loading" | "ok" | "unavailable" | "busy" | "no_loan"; whatIf: WhatIfView | null };

export function useWhatIf() {
  const choice = useChoice();
  const [result, setResult] = useState<WhatIfResult>({ status: "idle", whatIf: null });
  const run = useCallback(
    async (daysEarly: number) => {
      setResult((r) => ({ ...r, status: "loading" }));
      const res = await getJson<WhatIfResponse>("/api/score/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ daysEarly }),
      });
      if (res?.source === "mock") {
        const whatIf = await mockWhatIf(choice, daysEarly);
        setResult({ status: whatIf ? "ok" : "no_loan", whatIf });
      } else if (!res) setResult({ status: "unavailable", whatIf: null });
      else setResult({ status: res.status, whatIf: res.whatIf });
    },
    [choice],
  );
  return { ...result, run };
}

/** Demo controls: load a preset. Live mode creates a fake student in the service; mock mode switches fixtures. */
export async function loadAuraPreset(preset: string) {
  const res = await getJson<{ source: Source; ok?: boolean }>("/api/score/demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preset }),
  });
  if (res?.source === "live") {
    // the worker scores the new fake student within a moment
    for (const ms of [0, 1500, 4000]) setTimeout(refreshAura, ms);
  }
}
