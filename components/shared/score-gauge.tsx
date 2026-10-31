"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getBand } from "@/lib/score";
import { CountUp } from "./count-up";

interface ScoreGaugeProps {
  /** 0 to 100 */
  value: number;
  className?: string;
}

/** Semicircle gauge. The arc animates whenever `value` changes (used by the slider on the landing page). */
export function ScoreGauge({ value, className }: ScoreGaugeProps) {
  const id = useId();
  const band = getBand(value);
  const v = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div className={className}>
      <div role="img" aria-label={`Score ${value} out of 100, band: ${band.label}`} className="relative mx-auto w-full max-w-[280px]">
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8b5cf6" />
              <stop offset="0.55" stopColor="#e11d8f" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M 14 100 A 86 86 0 0 1 186 100" fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth="14" strokeLinecap="round" />
          <motion.path
            d="M 14 100 A 86 86 0 0 1 186 100"
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 7px rgba(192,38,211,0.75))" }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: v }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-5xl font-extrabold leading-none tracking-tight tabular-nums">
            <CountUp value={value} immediate />
          </div>
          <div className="mt-2 flex justify-center">
            <Badge tone={band.tone}>{band.label}</Badge>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-[280px] justify-between px-1 text-xs text-muted" aria-hidden>
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
