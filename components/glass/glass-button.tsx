"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
  "sweep relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-[background-color,color,box-shadow] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** black pill on light, white pill on dark */
        default: "bg-pill text-pill-fg hover:opacity-90",
        accent: "bg-accent text-accent-ink hover:brightness-95",
        secondary: "bg-card text-ink hover:bg-[color-mix(in_oklab,var(--card)_80%,var(--ink)_8%)]",
        outline: "border border-hairline bg-transparent text-ink hover:bg-card",
        ghost: "text-ink hover:bg-card",
        soft: "bg-accent-soft text-ink hover:bg-accent/45",
        warning: "bg-warn text-[#111] hover:brightness-95",
      },
      size: {
        default: "min-h-12 px-6 text-[15px]",
        sm: "min-h-11 px-4 text-sm",
        lg: "min-h-14 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface GlassButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
}

/** Pill button with spring press feedback and a light sweep on hover. `asChild` wraps a Link/anchor (CSS press instead of spring). */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const classes = cn(glassButtonVariants({ variant, size }), className);
  if (asChild) {
    return <Slot ref={ref as React.Ref<HTMLElement>} className={cn(classes, "transition-transform active:scale-[0.96]")} {...props} />;
  }
  return (
    <motion.button
      ref={ref}
      className={classes}
      whileTap={{ scale: 0.97 }}
      transition={spring.press}
      {...props}
    />
  );
});
