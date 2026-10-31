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
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-foreground/10", className)}
    >
      <motion.div
        className={cn("gradient-neon h-full rounded-full shadow-[0_0_14px_1px_rgba(192,38,211,0.7)]", barClassName)}
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
