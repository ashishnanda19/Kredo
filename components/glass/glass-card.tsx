import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strength?: "soft" | "default" | "strong";
  radius?: "md" | "lg" | "xl";
  /** lift on hover */
  interactive?: boolean;
}

const radiusClass = { md: "rounded-[16px]", lg: "rounded-[20px]", xl: "rounded-[24px]" } as const;
const strengthClass = { soft: "glass-soft", default: "", strong: "glass-strong" } as const;

/** Card surface: elevated fill, hairline border, soft shadow (soft = flat grey card, strong = lifted). */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, strength = "default", radius = "md", interactive, ...props },
  ref,
) {
  return <div ref={ref} className={cn("glass text-ink", strengthClass[strength], radiusClass[radius], interactive && "glass-hover", className)} {...props} />;
});
