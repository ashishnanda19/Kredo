"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CoinSpec } from "@/components/three/coin-field";
import { useGlTier, usePrefersReducedMotion } from "@/lib/quality";

// WebGL is lazy and client-only; low-power devices never download it
const CoinField = dynamic(() => import("@/components/three/coin-field"), { ssr: false });

/** Wide screens: in the margins either side of the headline and the email field, never over them. */
const WIDE: CoinSpec[] = [
  { u: 0.055, v: 0.3, z: 1.6, size: 0.36, look: "gold" },
  { u: 0.945, v: 0.25, z: 2.3, size: 0.42, look: "ink" },
  { u: 0.135, v: 0.74, z: -2, size: 0.32, look: "gold" },
  { u: 0.87, v: 0.72, z: -1, size: 0.3, look: "gold" },
  { u: 0.255, v: 0.64, z: -4, size: 0.3, look: "ink" },
  { u: 0.755, v: 0.6, z: -3.5, size: 0.3, look: "gold" },
];

/** Phones: four small coins in the corners of the block. */
const NARROW: CoinSpec[] = [
  { u: 0.07, v: 0.07, z: -1, size: 0.3, look: "gold" },
  { u: 0.93, v: 0.1, z: 1, size: 0.34, look: "ink" },
  { u: 0.06, v: 0.95, z: 0.5, size: 0.3, look: "gold" },
  { u: 0.94, v: 0.93, z: -2, size: 0.3, look: "gold" },
];

/**
 * The page ends where it began: the coins that scattered from the splash gather again around the last headline,
 * flying in from outside the frame as the section scrolls up into view (the same 3D field as the splash, here in
 * the studio lighting that suits a plain page). Fills its positioned parent. Nothing on low-power devices or under
 * reduced motion.
 */
export function EndingCoins() {
  const tier = useGlTier();
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const on = !reduce && (tier === "high" || tier === "mid");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  // 0 as the block's top edge meets the bottom of the screen, 1 once it has climbed to a third of the way down
  const progress = useCallback(() => {
    const el = ref.current;
    if (!el) return 0;
    const h = window.innerHeight;
    return Math.min(1, Math.max(0, (h - el.getBoundingClientRect().top) / (h * 0.67)));
  }, []);

  if (!on) return null;
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      <CoinField wide={WIDE} narrow={NARROW} progress={progress} motion="arrive" active={near} tier={tier} />
    </div>
  );
}
