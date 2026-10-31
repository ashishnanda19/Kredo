"use client";

import { useLayoutEffect, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { gsap, registerGsap, scheduleRefresh } from "@/lib/scroll";

/**
 * Run a GSAP/ScrollTrigger setup scoped to `scope`, skipped entirely under prefers-reduced-motion.
 * Everything created inside is reverted on cleanup (gsap.context), and ScrollTrigger is refreshed
 * (debounced) because lazy sections change page height as they mount.
 *
 * Rule of the house: GSAP animates scroll scenes (and the card rig); Framer Motion animates UI
 * micro-interactions. Never both on the same element.
 */
export function useGsapScene(scope: RefObject<HTMLElement | null>, setup: (root: HTMLElement) => void) {
  const reduce = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || reduce) return;
    registerGsap();
    const ctx = gsap.context(() => setup(root), root);
    scheduleRefresh();
    return () => ctx.revert();
    // setup is intentionally captured once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, scope]);
}
