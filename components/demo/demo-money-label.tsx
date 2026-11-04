"use client";

import { FlaskConical } from "lucide-react";
import { DEMO_LABEL } from "@/lib/copy-demo";
import { cn } from "@/lib/utils";
import { useEmbedded } from "./use-embedded";

/** The "nothing here is real money" label for demo-world screens. Not shown inside the Demo Stage's phone frames. */
export function DemoMoneyLabel({ className }: { className?: string }) {
  const embedded = useEmbedded();
  if (embedded) return null;
  return (
    <span data-testid="demo-money-label" className={cn("inline-flex items-center gap-1.5 rounded-full border border-warn/45 bg-warning-soft px-3 py-1 text-xs font-semibold text-warn-text", className)}>
      <FlaskConical className="size-3.5" aria-hidden /> {DEMO_LABEL}
    </span>
  );
}
