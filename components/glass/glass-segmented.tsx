"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface GlassSegmentedProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}

/** Dark segmented pill with a yellow selected segment that slides with a slight stretch. */
export function GlassSegmented<T extends string>({ options, value, onChange, label, className }: GlassSegmentedProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("scrollbar-none inline-flex max-w-full overflow-x-auto rounded-full bg-[#111113] p-1 dark:bg-[#1c1c24]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-h-11 min-w-20 flex-1 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors sm:px-5",
              on ? "text-accent-ink" : "text-white/70 hover:text-white",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring.stretch}
                className="absolute inset-0 rounded-full bg-accent"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
