"use client";

import { useCallback, useEffect, useState } from "react";
import { useHydrated, useStore } from "@/lib/store/store";
import { mockRisk } from "./mock";

/**
 * Data for the ops risk console. Calls go to the BFF (/api/ops/risk/*) with the demo role in a header; with the
 * score service unset the BFF says {source: "mock"} and the fixtures answer instead (read-only).
 */
export type RiskStatus = "loading" | "ok" | "forbidden" | "not_found" | "error";
export type RiskSource = "live" | "mock";

const ROLE_HEADER = "x-kredo-ops-role";
const REFRESH = "ops-risk:refresh";

export function refreshRisk() {
  window.dispatchEvent(new Event(REFRESH));
}

function statusOf(code: number): RiskStatus {
  if (code >= 200 && code < 300) return "ok";
  if (code === 401 || code === 403) return "forbidden";
  if (code === 404) return "not_found";
  return "error";
}

async function call(role: string, method: string, path: string, body?: unknown): Promise<{ source: RiskSource; status: number; data: unknown }> {
  try {
    const res = await fetch(`/api/ops/risk/${path}`, {
      method,
      cache: "no-store",
      headers: { [ROLE_HEADER]: role, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && typeof data === "object" && (data as { source?: string }).source === "mock") return { source: "mock", status: 0, data: null };
    return { source: "live", status: res.status, data };
  } catch {
    return { source: "live", status: 0, data: null };
  }
}

export interface RiskResult<T> {
  status: RiskStatus;
  data: T | null;
  source: RiskSource | null;
}

export function useRisk<T>(path: string | null): RiskResult<T> {
  const hydrated = useHydrated();
  const role = useStore((s) => s.ops.role);
  const [tick, setTick] = useState(0);
  const request = `${role}|${path}|${tick}`;
  const [result, setResult] = useState<(RiskResult<T> & { request: string }) | null>(null);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(REFRESH, bump);
    return () => window.removeEventListener(REFRESH, bump);
  }, []);

  useEffect(() => {
    if (!hydrated || !path) return;
    let alive = true;
    (async () => {
      const live = await call(role, "GET", path);
      const answer = live.source === "mock" ? await mockRisk(role, path) : live;
      if (alive) setResult({ request: `${role}|${path}|${tick}`, status: statusOf(answer.status), data: statusOf(answer.status) === "ok" ? (answer.data as T) : null, source: live.source });
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, role, path, tick]);

  if (!path) return { status: "loading", data: null, source: null };
  return result?.request === request ? result : { status: "loading", data: result?.data ?? null, source: result?.source ?? null };
}

export type ActionResult = { ok: boolean; status: number; code?: string; data: unknown; mock?: boolean };

/** A change (create, approve, confirm...). In mock mode nothing is sent and `mock` is true. */
export function useRiskAction() {
  const role = useStore((s) => s.ops.role);
  return useCallback(
    async (method: "POST" | "PATCH", path: string, body: unknown = {}): Promise<ActionResult> => {
      const res = await call(role, method, path, body);
      if (res.source === "mock") return { ok: false, status: 0, data: null, mock: true };
      const code = (res.data as { detail?: { code?: string } } | null)?.detail?.code;
      return { ok: res.status >= 200 && res.status < 300, status: res.status, code, data: res.data };
    },
    [role],
  );
}
