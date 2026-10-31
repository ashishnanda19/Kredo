"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0 to 100
  label: string;
  className?: string;
  barClassName?: string;
}

/** Linear progress bar that animates its width into place. */
export function Progress({ value, label, className, barClassName }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-ink/10", className)}
    >
      <motion.div
        className={cn("bg-pill text-pill-fg h-full rounded-full", barClassName)}
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
