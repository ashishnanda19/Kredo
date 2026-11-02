"use client";

/**
 * The demo world's store: the seeded world (ledger, scores, settlements), the signed-in persona, and the Demo Director's
 * switches. Separate from the portal store (lib/store/store.ts) so a world reset never touches portal flows.
 *
 * It runs entirely in the browser (no backend), persisted to localStorage; Reset demo rebuilds the exact seed. The
 * world is saved whole because it is small (about 250 KB) and replaying it from a log would add risk for no benefit.
 *
 * MONEY BOUNDARY: nothing here moves money. Settlement instructions go to the NbfcPort (the lender); the store only
 * records the answers.
 */
import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createMockAdapters, defaultScenarios, getAdapters, setAdapters, type Scenarios } from "../api";
import { DEMO_PIN } from "../demo/constants";
import { buildSeedWorld } from "../demo/seed";
import { recordAudit, advanceTo, WORLD_SCHEMA } from "../domain/world";
import { nextCutoff } from "../domain/time";
import { loansOfStudent, isOpen } from "../domain/selectors";
import { applySettlementResult, markProcessing, retrySettlement as retryDomain, submitInstructions, toInstruction } from "../settlement";
import { getPolicy } from "../policy";
import type { Session, WorldState } from "../domain/types";
import { daysPastDue, DAY, HOUR, istStartOf, istDate } from "../domain/time";

export const emptySession = (): Session => ({ studentId: null, vendorId: null, activeRole: null, confirmedAt: null });

interface WorldStore {
  world: WorldState;
  session: Session;
  scenarios: Scenarios;
  /** Presenter mode: bigger phones, less chrome. Used by the Demo Stage (Milestone 6). */
  presenter: boolean;
  /** When each account last opened its notifications tray (simulated clock), to count the unread ones. */
  seen: Record<string, number>;

  /** Rebuilds the exact seeded starting state, signs everyone out and clears the switches. */
  reset: () => void;
  /** Runs a pure reducer over the world. */
  apply: (fn: (w: WorldState) => WorldState) => void;

  /** Moves the simulated clock, running scheduled work, then sends any new settlements to the lender. */
  advanceTo: (target: number, label?: string) => void;
  advanceBy: (ms: number, label?: string) => void;
  toNextMidnight: () => void;
  /** To the due date of the signed-in student's next open loan (09:00 that day). */
  toDueDate: () => void;
  /** To N days past the due date of the signed-in student's most overdue (or next) open loan. */
  toPastDue: (days: number) => void;

  /** Signs in as a seeded person without credentials (demo mode). Confirms the session. */
  signInAs: (studentId: string | null, vendorId: string | null, role: "student" | "vendor") => void;
  signOut: () => void;
  /** After a stall account is created: make it the signed-in stall (the student side, if any, stays attached). */
  attachVendor: (vendorId: string) => void;
  setActiveRole: (role: "student" | "vendor") => void;
  /** Records a successful PIN or OTP confirmation (wall-clock time). */
  confirmSession: () => void;
  /** True if the demo PIN matches. The demo PIN is shown on screen in demo mode. */
  checkPin: (pin: string) => boolean;

  /** Sends every scheduled settlement to the lender (the mock) and records its answer. */
  runSettlements: () => Promise<void>;
  /** Ops: put a failed or held settlement back in the queue and send it again. */
  retrySettlement: (id: string, actor: string) => Promise<void>;

  setScenario: <K extends keyof Scenarios>(key: K, value: Scenarios[K]) => void;
  setPresenter: (on: boolean) => void;
  markSeen: (accountId: string) => void;
}

/** Sends every scheduled settlement to the lender (the mock NBFC) and records its answer. Async: the lender takes a moment. */
async function runSettlementQueue(get: () => WorldStore, set: (p: Partial<WorldStore>) => void) {
  const scheduled = Object.values(get().world.settlements).filter((s) => s.status === "scheduled");
  if (!scheduled.length) return;
  const now = get().world.clock.now;
  set({ world: markAll(get().world, scheduled.map((s) => s.id), now) });
  const results = await submitInstructions(scheduled.map(toInstruction), getAdapters().nbfc);
  let w = get().world;
  const at = w.clock.now;
  for (const r of results) w = apply1(w, r.id, r.result, at);
  set({ world: w });
}

import { produce } from "immer";
const markAll = (w: WorldState, ids: string[], at: number) => produce(w, (d) => void ids.forEach((id) => markProcessing(d, id, at)));
const apply1 = (w: WorldState, id: string, result: Parameters<typeof applySettlementResult>[2], at: number) => produce(w, (d) => void applySettlementResult(d, id, result, at));

export const useWorld = create<WorldStore>()(
  persist(
    (set, get) => ({
      world: buildSeedWorld(),
      session: emptySession(),
      scenarios: defaultScenarios(),
      presenter: false,
      seen: {},

      reset: () => set({ world: buildSeedWorld(), session: emptySession(), scenarios: defaultScenarios(), presenter: false, seen: {} }),
      apply: (fn) => set((s) => ({ world: fn(s.world) })),

      advanceTo: (target, label) => {
        set((s) => ({ world: advanceTo(s.world, target, label) }));
        void runSettlementQueue(get, set);
      },
      advanceBy: (ms, label) => get().advanceTo(get().world.clock.now + ms, label),
      toNextMidnight: () => get().advanceTo(nextCutoff(get().world.clock.now, 0), "Next midnight"),
      toDueDate: () => {
        const { world, session } = get();
        const open = session.studentId ? loansOfStudent(world, session.studentId).filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] : undefined;
        if (!open) return;
        get().advanceTo(Math.max(world.clock.now, istStartOf(open.dueDate, 9)), "To due date");
      },
      toPastDue: (days) => {
        const { world, session } = get();
        const open = session.studentId ? loansOfStudent(world, session.studentId).filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] : undefined;
        if (!open) return;
        const target = istStartOf(open.dueDate, 9) + days * DAY;
        get().advanceTo(Math.max(world.clock.now, target), `${days} days past due`);
      },

      signInAs: (studentId, vendorId, role) => {
        set((s) => ({ session: { studentId, vendorId, activeRole: role, confirmedAt: Date.now() }, world: recordAudit(s.world, { actor: studentId ?? vendorId ?? "demo", action: "session.signed_in", target: role, details: { demo: true } }) }));
      },
      signOut: () => set({ session: emptySession() }),
      attachVendor: (vendorId) => set((s) => ({ session: { ...s.session, vendorId, activeRole: "vendor", confirmedAt: Date.now() } })),
      setActiveRole: (role) =>
        set((s) => ({
          session: { ...s.session, activeRole: role },
          world: recordAudit(s.world, { actor: s.session.studentId ?? s.session.vendorId ?? "demo", action: "session.role_switched", target: role }),
        })),
      confirmSession: () => set((s) => ({ session: { ...s.session, confirmedAt: Date.now() } })),
      checkPin: (pin) => pin === DEMO_PIN,

      runSettlements: () => runSettlementQueue(get, set),
      retrySettlement: async (id, actor) => {
        set((s) => ({ world: produce(s.world, (d) => void retryDomain(d, id, d.clock.now, actor)) }));
        await runSettlementQueue(get, set);
      },

      setScenario: (key, value) => set((s) => ({ scenarios: { ...s.scenarios, [key]: value } })),
      setPresenter: (on) => set({ presenter: on }),
      markSeen: (accountId) => set((s) => ({ seen: { ...s.seen, [accountId]: s.world.clock.now } })),
    }),
    {
      name: "kredo-demo-world",
      version: WORLD_SCHEMA,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ world: s.world, session: s.session, scenarios: s.scenarios, seen: s.seen }) as unknown as WorldStore,
      // a saved world from an older shape is discarded (the seed is rebuilt) rather than misread
      merge: (persisted, current) => {
        const p = persisted as Partial<WorldStore> | undefined;
        return p?.world && p.world.schema === WORLD_SCHEMA ? { ...current, world: p.world, session: p.session ?? current.session, scenarios: p.scenarios ?? current.scenarios, seen: p.seen ?? {} } : current;
      },
    },
  ),
);

/** True once the saved world has been loaded from localStorage (avoids server and client mismatches). */
export function useWorldHydrated(): boolean {
  useEffect(() => {
    if (!useWorld.persist.hasHydrated()) void useWorld.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (cb) => useWorld.persist.onFinishHydration(cb),
    () => useWorld.persist.hasHydrated(),
    () => false,
  );
}

// re-exported so screens need only this module
export { getPolicy, daysPastDue, HOUR, istDate };

// the mock lender and verification read the presenter's choices from this store at the moment they are called
setAdapters(createMockAdapters(() => useWorld.getState().scenarios));
