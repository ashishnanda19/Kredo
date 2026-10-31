"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({ className, "aria-label": ariaLabel, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root className={cn("relative flex h-11 w-full touch-none select-none items-center", className)} {...props}>
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-foreground/15">
        <SliderPrimitive.Range className="gradient-neon absolute h-full shadow-[0_0_14px_rgba(192,38,211,0.6)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={ariaLabel} className="block size-7 rounded-full border-2 border-neon-magenta bg-white shadow-[0_0_20px_rgba(192,38,211,0.7)] transition-transform hover:scale-110 focus-visible:scale-110" />
    </SliderPrimitive.Root>
  );
}
