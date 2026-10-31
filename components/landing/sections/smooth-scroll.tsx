"use client";

import { useLayoutEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/quality";
import { createSmoothScroll, scheduleRefresh, ScrollTrigger } from "@/lib/scroll";

/** Lenis smooth scrolling for the landing page (off under reduced motion), plus ScrollTrigger upkeep as lazy sections mount. */
export function SmoothScroll() {
  const reduce = usePrefersReducedMotion();
  useLayoutEffect(() => {
    if (reduce) return;
    const stop = createSmoothScroll();
    const ro = new ResizeObserver(() => scheduleRefresh(200));
    ro.observe(document.body);
    void document.fonts?.ready.then(() => scheduleRefresh(50));
    return () => {
      ro.disconnect();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      stop();
    };
  }, [reduce]);
  return null;
}
