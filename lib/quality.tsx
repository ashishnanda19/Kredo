"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { Tier } from "./theme";

/**
 * Adaptive quality: "high" (full 3D + bloom + coin physics), "mid" (3D, no bloom, fewer orbs),
 * "low" (CSS card, CSS confetti, minimal blur). Decided synchronously from cheap signals
 * (cores, memory, screen, reduced motion) and refined asynchronously by detect-gpu.
 * Markup never depends on the tier during SSR; tier-dependent styling goes through
 * html[data-quality] so hydration stays stable.
 */

const rank: Record<Tier, number> = { low: 0, mid: 1, high: 2 };
const minTier = (a: Tier, b: Tier): Tier => (rank[a] <= rank[b] ? a : b);

let gpuTier: Tier | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function heuristic(): Tier {
  if (typeof window === "undefined") return "mid";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (cores <= 2 || (mem !== undefined && mem <= 2)) return "low";
  if (window.innerWidth < 640 || cores <= 4 || (mem !== undefined && mem <= 4)) return "mid";
  return "high";
}

function getSnapshot(): Tier {
  const h = heuristic();
  return gpuTier ? minTier(h, gpuTier) : h;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  window.addEventListener("resize", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
    window.removeEventListener("resize", cb);
  };
}

let gpuStarted = false;
let gpuDone = false;
const markDone = () => {
  gpuDone = true;
  emit();
};
async function probeGpu() {
  if (gpuStarted) return;
  gpuStarted = true;
  try {
    const { getGPUTier } = await import("detect-gpu");
    // benchmarks are self-hosted under /public/gpu-benchmarks (no third-party CDN call)
    const r = await getGPUTier({ benchmarksURL: "/gpu-benchmarks" });
    let t: Tier = r.tier >= 3 ? "high" : r.tier >= 1 ? "mid" : "low";
    if (r.isMobile && t === "high") t = "mid";
    gpuTier = t;
  } catch {
    /* keep heuristic */
  }
  markDone();
}

/**
 * WebGL tier. Returns "pending" until the GPU probe has finished AND the page has loaded and gone idle,
 * so heavy 3D code never competes with first paint (and never loads on a GPU we are about to rate "low").
 * Only "high" devices preload 3D when idle; others (phones, mid GPUs) wait for the first interaction, because
 * the inline CSS poster card already looks right until then. Parsing the 3D bundle is ~1s of main-thread work
 * on a throttled phone, so it should not run before the user has even touched the page.
 * Use this (not useQuality) to decide whether to mount any WebGL canvas.
 */
let idleReady = false;
let interacted = false;
const idleListeners = new Set<() => void>();
function whenIdle() {
  const fire = () => {
    // small extra delay so the first interaction/LCP is never delayed by 3D
    setTimeout(() => {
      idleReady = true;
      idleListeners.forEach((l) => l());
    }, 1200);
  };
  const run = () => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(fire, { timeout: 3000 });
    else fire();
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });

  // first real interaction (scroll, touch, key, click)
  const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
  const onInteract = () => {
    interacted = true;
    events.forEach((e) => window.removeEventListener(e, onInteract));
    idleListeners.forEach((l) => l());
  };
  events.forEach((e) => window.addEventListener(e, onInteract, { passive: true }));
}
const subscribeAll = (cb: () => void) => {
  listeners.add(cb);
  idleListeners.add(cb);
  return () => {
    listeners.delete(cb);
    idleListeners.delete(cb);
  };
};

export function useGlTier(): Tier | "pending" {
  const tier = useContext(QualityContext);
  const ready = useSyncExternalStore(
    subscribeAll,
    () => idleReady && (gpuDone || heuristic() === "low") && (tier === "high" || interacted),
    () => false,
  );
  return ready ? tier : "pending";
}

const QualityContext = createContext<Tier>("mid");

export function useQuality(): Tier {
  return useContext(QualityContext);
}

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const tier = useSyncExternalStore(subscribe, getSnapshot, () => "mid" as Tier);

  useEffect(() => {
    document.documentElement.dataset.quality = tier;
  }, [tier]);

  useEffect(() => {
    whenIdle();
    if (heuristic() === "low") return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => void probeGpu());
    else setTimeout(() => void probeGpu(), 1500);
  }, []);

  return <QualityContext.Provider value={tier}>{children}</QualityContext.Provider>;
}

/** True when the user asked for reduced motion. Safe on the server (false). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
