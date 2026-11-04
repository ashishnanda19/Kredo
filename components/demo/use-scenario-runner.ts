"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCENARIOS, type Scenario, type ScenarioCtx, type StepAction } from "@/lib/demo/scenarios";
import { useStore } from "@/lib/store/store";
import { useWorld } from "@/lib/store/world";

export interface LogItem {
  caption: string;
  detail: string;
  actions: StepAction[];
}

export interface RunState {
  scenario: Scenario | null;
  /** Steps already run. */
  index: number;
  log: LogItem[];
  status: "idle" | "waiting" | "running" | "done" | "error";
  error?: string;
}

const IDLE: RunState = { scenario: null, index: 0, log: [], status: "idle" };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Hooks {
  onStudent: (studentId: string, path?: string) => void;
  onVendor: (vendorId: string, path?: string) => void;
  /** Pause between auto-played steps, in ms. */
  pauseMs: number;
}

/**
 * Runs a scripted scenario one step at a time (Next step) or by itself (Auto-play), against the live demo world.
 * The script acts through the same domain functions as the app; the two phone frames follow along.
 */
export function useScenarioRunner(hooks: Hooks) {
  const [state, setState] = useState<RunState>(IDLE);
  const token = useRef(0);
  const stateRef = useRef<RunState>(IDLE);
  const memo = useRef<Record<string, string>>({});
  const hooksRef = useRef(hooks);
  useEffect(() => {
    hooksRef.current = hooks;
  });

  const commit = useCallback((next: RunState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const ctx = useMemo<ScenarioCtx>(
    () => ({
      world: () => useWorld.getState().world,
      update: (fn) => useWorld.getState().apply(fn),
      advanceTo: async (ms, label) => {
        useWorld.getState().advanceTo(ms, label);
        await useWorld.getState().runSettlements();
      },
      setLender: (a) => useWorld.getState().setScenario("nbfc", a),
      student: (id, path) => hooksRef.current.onStudent(id, path),
      vendor: (id, path) => hooksRef.current.onVendor(id, path),
      ops: (path) => {
        useStore.getState().setRole("admin");
        window.open(path, "_blank");
      },
      get memo() {
        return memo.current;
      },
    }),
    [],
  );

  const start = useCallback(
    (n: number, fresh: boolean) => {
      const scenario = SCENARIOS.find((s) => s.n === n) ?? null;
      token.current++;
      memo.current = {};
      if (scenario && fresh) useWorld.getState().resetKeepingUi();
      commit(scenario ? { scenario, index: 0, log: [], status: "waiting" } : IDLE);
    },
    [commit],
  );

  const step = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur.scenario || cur.status === "running" || cur.index >= cur.scenario.steps.length) return;
    const myToken = token.current;
    const s = cur.scenario.steps[cur.index];
    commit({ ...cur, status: "running" });
    try {
      const detail = (await s.run(ctx)) ?? "";
      if (token.current !== myToken) return;
      const actions = s.actions?.(ctx) ?? [];
      const log = [...cur.log, { caption: s.caption, detail, actions }];
      const index = cur.index + 1;
      commit({ scenario: cur.scenario, index, log, status: index >= cur.scenario.steps.length ? "done" : "waiting" });
    } catch (e) {
      if (token.current !== myToken) return;
      commit({ ...cur, status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }, [commit, ctx]);

  const play = useCallback(async () => {
    const myToken = token.current;
    while (token.current === myToken && stateRef.current.scenario && stateRef.current.status === "waiting") {
      await step();
      if (token.current !== myToken) return;
      if (stateRef.current.status === "waiting") await sleep(hooksRef.current.pauseMs);
    }
  }, [step]);

  const playAll = useCallback(
    async (fresh: boolean) => {
      for (const sc of SCENARIOS) {
        start(sc.n, fresh);
        const myToken = token.current;
        await sleep(hooksRef.current.pauseMs);
        await play();
        if (token.current !== myToken || stateRef.current.status === "error") return;
        await sleep(hooksRef.current.pauseMs);
      }
    },
    [start, play],
  );

  const stop = useCallback(() => {
    token.current++;
    const cur = stateRef.current;
    if (cur.status === "running" || cur.status === "waiting") commit({ ...cur, status: cur.index >= (cur.scenario?.steps.length ?? 0) ? "done" : "waiting" });
  }, [commit]);

  return { state, start, step, play, playAll, stop };
}
