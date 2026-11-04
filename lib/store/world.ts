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
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createMockAdapters, defaultScenarios, getAdapters, setAdapters, type Scenarios } from "../api";
import { createEngineScoreProvider } from "../aura/provider";
import { DEMO_PIN } from "../demo/constants";
import { buildSeedWorld } from "../demo/seed";
import { recordAudit, advanceTo, WORLD_SCHEMA } from "../domain/world";
import { nextCutoff } from "../domain/time";
import { loansOfStudent, isOpen } from "../domain/selectors";
import { applySettlementResult, markProcessing, retrySettlement as retryDomain, submitInstructions, toInstruction } from "../settlement";
import { getPolicy } from "../policy";
import type { Session, WorldState } from "../domain/types";
import { daysPastDue, DAY, HOUR, istStartOf, istDate } from "../domain/time";

const WORLD_KEY = "kredo-demo-world";
const SESSION_KEY = "kredo-demo-session";

/**
 * The world (ledger, scores, settlements, the presenter's switches) lives in localStorage so every window on this
 * origin shares it; the SIGNED-IN PERSON lives in sessionStorage so each window, and each phone frame on the Demo
 * Stage, can be a different person. Other windows hear about a change through the browser's `storage` event.
 */
/**
 * The shared part of the state as this window last read or wrote it. A window that only changed WHO is signed in (a
 * phone frame starting up) must not write its copy of the world back, or it could overwrite a payment another window
 * made a moment earlier.
 */
let lastSyncedShared: string | null = null;

/**
 * Where the signed-in person is kept. A normal tab uses sessionStorage. A phone frame on the Demo Stage cannot:
 * sessionStorage is shared by every same-origin frame of a tab, so the two phones would overwrite each other's person.
 * A frame keeps its person in `window.name`, which belongs to that one frame and survives its reloads.
 */
const NAME_PREFIX = "kredo-session:";
const isFrame = () => window.self !== window.top;
const readSession = (): string | null => {
  if (isFrame()) return window.name.startsWith(NAME_PREFIX) ? window.name.slice(NAME_PREFIX.length) : null;
  return sessionStorage.getItem(SESSION_KEY);
};
const writeSession = (value: string): void => {
  if (isFrame()) window.name = NAME_PREFIX + value;
  else sessionStorage.setItem(SESSION_KEY, value);
};

const splitStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const j = JSON.parse(raw) as { state?: Record<string, unknown> };
      lastSyncedShared = raw;
      if (j.state) {
        const ses = readSession();
        j.state.session = ses ? JSON.parse(ses) : undefined;
      }
      return JSON.stringify(j);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const j = JSON.parse(value) as { state: { session?: unknown } & Record<string, unknown> };
      const { session, ...rest } = j.state;
      writeSession(JSON.stringify(session ?? null));
      const shared = JSON.stringify({ ...j, state: rest });
      if (shared === lastSyncedShared) return; // only the signed-in person changed here
      lastSyncedShared = shared;
      localStorage.setItem(name, shared);
    } catch {
      /* storage blocked or full: the demo still runs in memory */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      if (!isFrame()) sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** A cheap structural check, so a damaged saved world falls back to the seed instead of crashing a screen. */
function looksLikeWorld(w: WorldState): boolean {
  return !!w && typeof w === "object" && !!w.clock && typeof w.clock.now === "number" && [w.accounts, w.students, w.vendors, w.loans, w.settlements].every((x) => x && typeof x === "object") && [w.audit, w.scoreEvents, w.notifications, w.repayments, w.flags, w.refunds, w.adjustments].every(Array.isArray);
}

export const emptySession = (): Session => ({ studentId: null, vendorId: null, activeRole: null, confirmedAt: null });

interface WorldStore {
  world: WorldState;
  session: Session;
  scenarios: Scenarios;
  /** Presenter mode: bigger phones, less chrome. Used by the Demo Stage (Milestone 6). */
  presenter: boolean;
  /** Shows the "Kredo does not touch money" diagram over every screen. */
  flowOverlay: boolean;
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
  /** A phone frame on the Demo Stage takes its own person without leaving an audit entry. */
  enterAs: (studentId: string | null, vendorId: string | null, role: "student" | "vendor") => void;
  /** Reset the world but leave the presenter's display switches where they are (used between scripted scenarios). */
  resetKeepingUi: () => void;
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
  setFlowOverlay: (on: boolean) => void;
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

/** Settlement runs are chained, so awaiting one waits for any already in flight (the lender answers asynchronously). */
let settleQueue: Promise<void> = Promise.resolve();

export const useWorld = create<WorldStore>()(
  persist(
    (set, get) => ({
      world: buildSeedWorld(),
      session: emptySession(),
      scenarios: defaultScenarios(),
      presenter: false,
      flowOverlay: false,
      seen: {},

      reset: () => set({ world: buildSeedWorld(), session: emptySession(), scenarios: defaultScenarios(), presenter: false, seen: {} }),
      apply: (fn) => set((s) => ({ world: fn(s.world) })),

      advanceTo: (target, label) => {
        set((s) => ({ world: advanceTo(s.world, target, label) }));
        settleQueue = settleQueue.then(() => runSettlementQueue(get, set));
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
      enterAs: (studentId, vendorId, role) => set({ session: { studentId, vendorId, activeRole: role, confirmedAt: Date.now() } }),
      resetKeepingUi: () => set((s) => ({ world: buildSeedWorld(), scenarios: defaultScenarios(), seen: {}, presenter: s.presenter, flowOverlay: s.flowOverlay })),
      attachVendor: (vendorId) => set((s) => ({ session: { ...s.session, vendorId, activeRole: "vendor", confirmedAt: Date.now() } })),
      setActiveRole: (role) =>
        set((s) => ({
          session: { ...s.session, activeRole: role },
          world: recordAudit(s.world, { actor: s.session.studentId ?? s.session.vendorId ?? "demo", action: "session.role_switched", target: role }),
        })),
      confirmSession: () => set((s) => ({ session: { ...s.session, confirmedAt: Date.now() } })),
      checkPin: (pin) => pin === DEMO_PIN,

      runSettlements: () => (settleQueue = settleQueue.then(() => runSettlementQueue(get, set))),
      retrySettlement: async (id, actor) => {
        set((s) => ({ world: produce(s.world, (d) => void retryDomain(d, id, d.clock.now, actor)) }));
        await (settleQueue = settleQueue.then(() => runSettlementQueue(get, set)));
      },

      setScenario: (key, value) => set((s) => ({ scenarios: { ...s.scenarios, [key]: value } })),
      setPresenter: (on) => set({ presenter: on }),
      setFlowOverlay: (on) => set({ flowOverlay: on }),
      markSeen: (accountId) => set((s) => ({ seen: { ...s.seen, [accountId]: s.world.clock.now } })),
    }),
    {
      name: WORLD_KEY,
      version: WORLD_SCHEMA,
      storage: createJSONStorage(() => splitStorage),
      skipHydration: true,
      partialize: (s) => ({ world: s.world, session: s.session, scenarios: s.scenarios, seen: s.seen }) as unknown as WorldStore,
      // a saved world from an older shape is discarded (the seed is rebuilt) rather than misread
      merge: (persisted, current) => {
        const p = persisted as Partial<WorldStore> | undefined;
        // a saved world from an older shape, or one that no longer looks like a world, is dropped and the seed is used
        return p?.world && p.world.schema === WORLD_SCHEMA && looksLikeWorld(p.world) ? { ...current, world: p.world, session: p.session ?? current.session, scenarios: p.scenarios ?? current.scenarios, seen: p.seen ?? {} } : current;
      },
    },
  ),
);

/** Keeps this window's copy of the world in step with changes made in other windows (the Demo Stage's phone frames). */
export function useWorldSync(): void {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WORLD_KEY && e.newValue) void useWorld.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

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
setAdapters({ ...createMockAdapters(() => useWorld.getState().scenarios), score: createEngineScoreProvider(() => useWorld.getState().world) });
