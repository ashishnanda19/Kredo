"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getBand } from "@/lib/score";
import { CountUp } from "./count-up";

interface ScoreGaugeProps {
  /** 0 to 100 */
  value: number;
  className?: string;
}

const R = 84;
const C = 2 * Math.PI * R;
const SWEEP = 0.75; // 270° ring, open at the bottom

/** Score ring: a 270° hairline track with an ink arc and a yellow end marker. The number sits in the middle. */
export function ScoreGauge({ value, className }: ScoreGaugeProps) {
  const band = getBand(value);
  const v = Math.max(0, Math.min(100, value)) / 100;
  // end-marker position: the ring starts at 135° (bottom-left) and runs clockwise
  const a = ((135 + 270 * v) * Math.PI) / 180;
  const mx = 100 + R * Math.cos(a);
  const my = 100 + R * Math.sin(a);

  return (
    <div className={className}>
      <div role="img" aria-label={`Score ${value} out of 100, band: ${band.label}`} className="relative mx-auto aspect-square w-full max-w-[260px]">
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
          <circle cx="100" cy="100" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-hairline" strokeDasharray={`${C * SWEEP} ${C}`} transform="rotate(135 100 100)" />
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-ink"
            transform="rotate(135 100 100)"
            initial={{ strokeDasharray: `0 ${C}` }}
            animate={{ strokeDasharray: `${C * SWEEP * v} ${C}` }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
          <motion.circle r="9" className="fill-accent stroke-page" strokeWidth="4" initial={false} animate={{ cx: mx, cy: my }} transition={{ type: "spring", stiffness: 70, damping: 18 }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-5xl font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">
              <CountUp value={value} immediate />
            </div>
            <div className="mt-2 flex justify-center">
              <Badge tone={band.tone}>{band.label}</Badge>
            </div>
          </div>
        </div>
        <span aria-hidden className="absolute bottom-[8%] left-[22%] text-xs text-ink-2">0</span>
        <span aria-hidden className="absolute bottom-[8%] right-[19%] text-xs text-ink-2">100</span>
      </div>
    </div>
  );
}
