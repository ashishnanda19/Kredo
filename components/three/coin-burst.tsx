"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Seeded PRNG: stable between renders and pure. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Small, cheap coin burst (DOM + Framer Motion) for in-card celebrations such as the early-access
 * success state. The big falling-coin shower on limit unlock lives in coin-rain.tsx (WebGL).
 */
export function CoinBurst({ count = 14 }: { count?: number }) {
  const reduce = useReducedMotion();
  const coins = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.4;
      const d = 90 + r() * 90;
      return { id: i, x: Math.cos(a) * d, y: Math.sin(a) * d - 40, s: 10 + r() * 8, rot: (r() - 0.5) * 720, delay: r() * 0.15, violet: i % 3 === 0 };
    });
  }, [count]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] z-10">
      {coins.map((c) => (
        <motion.span
          key={c.id}
          className="absolute block rounded-full border border-white/50"
          style={{
            width: c.s,
            height: c.s,
            background: c.violet ? "radial-gradient(circle at 30% 30%, #f0abfc, #8b5cf6)" : "radial-gradient(circle at 30% 30%, #fde68a, #f59e0b)",
            boxShadow: "0 0 12px rgba(251,191,36,0.6)",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: c.x, y: [0, c.y, c.y + 120], opacity: [1, 1, 0], scale: 1, rotate: c.rot }}
          transition={{ duration: 1.5, delay: c.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
