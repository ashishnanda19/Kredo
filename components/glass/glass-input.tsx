"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Text input: soft fill, hairline border, clear focus ring. */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(function GlassInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-12 w-full rounded-[14px] border border-hairline bg-card px-4 text-base text-ink transition-[border-color,box-shadow,background-color] placeholder:text-ink-2/80",
        "focus-visible:border-ink focus-visible:bg-page focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--info-fill)_22%,transparent)] focus-visible:outline-none disabled:opacity-50",
        invalid && "border-bad focus-visible:border-bad focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--bad-fill)_22%,transparent)]",
        className,
      )}
      {...props}
    />
  );
});

/** Validation message that animates in (and nudges once) when an error appears. */
export function GlassFieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.p
          key="err"
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto", x: [0, -5, 5, -3, 0] }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden pt-1.5 text-sm font-medium text-bad-text"
        >
          {children}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
