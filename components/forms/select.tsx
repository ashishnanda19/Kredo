import * as React from "react";
import { cn } from "@/lib/utils";

/** Native select styled as a glass input (accessible and mobile-friendly). */
export const GlassSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function GlassSelect({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-12 w-full appearance-none rounded-[18px] border border-foreground/20 bg-foreground/[0.07] px-4 text-base text-foreground backdrop-blur-xl transition-[border-color,box-shadow]",
        "bg-[length:1rem] bg-[position:right_1rem_center] bg-no-repeat [background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a3a1b5' stroke-width='2.5' stroke-linecap='round'><path d='m6 9 6 6 6-6'/></svg>\")] pr-10",
        "focus-visible:border-neon-violet focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon-violet)_30%,transparent)] focus-visible:outline-none disabled:opacity-50",
        invalid && "border-danger",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function GlassTextarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-28 w-full rounded-[18px] border border-foreground/20 bg-foreground/[0.07] px-4 py-3 text-base text-foreground backdrop-blur-xl transition-[border-color,box-shadow] placeholder:text-muted/80",
        "focus-visible:border-neon-violet focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--neon-violet)_30%,transparent)] focus-visible:outline-none disabled:opacity-50",
        invalid && "border-danger",
        className,
      )}
      {...props}
    />
  );
});
