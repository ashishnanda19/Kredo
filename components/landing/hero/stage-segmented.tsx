"use client";

import { useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface Props {
  stages: readonly { id: string; label: string; short?: string }[];
  active: number;
  onSelect: (i: number) => void;
  panelId: string;
  className?: string;
}

/**
 * Sticky hero control (tablist). Dark track, yellow thumb that slides with a slight liquid stretch.
 * Arrow keys / Home / End move between stages, as the ARIA tabs pattern expects.
 */
export function StageSegmented({ stages, active, onSelect, panelId, className }: Props) {
  const id = useId();
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = stages.length;
    const next = e.key === "ArrowRight" ? (active + 1) % n : e.key === "ArrowLeft" ? (active - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="How it works"
      onKeyDown={onKey}
      className={cn(
        "scrollbar-none inline-flex max-w-[calc(100vw-24px)] overflow-x-auto rounded-full bg-[#111113]/95 p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-md",
        className,
      )}
    >
      {stages.map((s, i) => {
        const on = i === active;
        return (
          <button
            key={s.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-tab-${s.id}`}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(i)}
            className={cn(
              "relative min-h-11 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors sm:px-5 sm:text-sm",
              on ? "text-accent-ink" : "text-white/70 hover:text-white",
            )}
          >
            {on && <motion.span layoutId={`stage-${id}`} transition={reduce ? { duration: 0 } : spring.stretch} className="absolute inset-0 rounded-full bg-accent" />}
            {/* narrow phones get the short label so all four fit without scrolling */}
            <span className="relative max-[399px]:hidden">{s.label}</span>
            <span aria-hidden className="relative min-[400px]:hidden">{s.short ?? s.label}</span>
            {s.short && <span className="sr-only min-[400px]:hidden">{s.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
