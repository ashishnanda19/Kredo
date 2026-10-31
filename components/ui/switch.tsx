"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full bg-ink/20 transition-colors data-[state=checked]:bg-ink",
        // enlarge the tap area to 44px without changing the visual size
        "after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-6 translate-x-1 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-7 data-[state=checked]:bg-page" />
    </SwitchPrimitive.Root>
  );
}
