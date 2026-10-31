"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
let current: Lenis | null = null;

/** Register GSAP plugins once (safe to call repeatedly, client only). */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

/**
 * Smooth inertial scrolling with Lenis, driven by GSAP's ticker (ONE shared RAF) and wired to
 * ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`). Returns a cleanup function.
 */
export function createSmoothScroll(): () => void {
  registerGsap();
  const lenis = new Lenis({
    lerp: 0.11,
    smoothWheel: true,
    anchors: { offset: -96 },
  });

  current = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    if (current === lenis) current = null;
  };
}

/** Scroll to an absolute Y, through Lenis when it is running (keeps the inertia consistent). */
export function scrollToY(y: number, immediate = false) {
  if (current) current.scrollTo(y, { immediate, duration: 1.1 });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export { gsap, ScrollTrigger };

let refreshTimer: ReturnType<typeof setTimeout> | undefined;

/** Debounced ScrollTrigger.refresh(): lazy sections mount at different times and shift layout. */
export function scheduleRefresh(delay = 120) {
  if (typeof window === "undefined") return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }, delay);
}
