"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSpecular } from "./use-specular";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strength?: "soft" | "default" | "strong";
  glow?: "none" | "violet" | "magenta";
  radius?: "md" | "lg" | "xl";
  /** lift on hover */
  interactive?: boolean;
}

const radiusClass = { md: "rounded-[20px]", lg: "rounded-[28px]", xl: "rounded-[32px]" } as const;
const strengthClass = { soft: "glass-soft", default: "", strong: "glass-strong" } as const;
const glowClass = { none: "", violet: "glass-glow-violet", magenta: "glass-glow-magenta" } as const;

/** Frosted glass surface: blur + saturate, gradient hairline, soft glow, pointer-following sheen. */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, strength = "default", glow = "none", radius = "md", interactive, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
  useSpecular(ref);

  return (
    <div
      ref={ref}
      className={cn(
        "glass text-foreground",
        strengthClass[strength],
        glowClass[glow],
        radiusClass[radius],
        interactive && "glass-hover",
        className,
      )}
      {...props}
    />
  );
});
