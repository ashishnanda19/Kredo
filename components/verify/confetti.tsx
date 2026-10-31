"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#a855f7", "#c4b5fd", "#e11d8f", "#f0abfc", "#38bdf8", "#fbbf24", "#4ade80"];

/** Small deterministic PRNG so pieces are stable between renders (and pure). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Light CSS/Framer confetti: the low-power stand-in for the WebGL coin shower. */
export function Confetti({ count = 42 }: { count?: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: r() * 100,
      size: 6 + r() * 8,
      delay: r() * 0.5,
      duration: 2.4 + r() * 1.6,
      drift: (r() - 0.5) * 160,
      spin: (r() - 0.5) * 900,
      color: COLORS[i % COLORS.length],
      round: r() > 0.6,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[85] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{ left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 0.5, background: p.color, borderRadius: p.round ? "50%" : 2 }}
          initial={{ y: -30, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", x: p.drift, opacity: [1, 1, 0], rotate: p.spin }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
