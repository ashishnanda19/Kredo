"use client";

import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { FLOW } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";
import { MoneyFlow } from "./money-flow";
import { useEmbedded } from "./use-embedded";

/** "Kredo does not touch money" on top of any screen, switched from the Demo Director. Not shown on the Demo Stage, which has its own. */
export function FlowOverlay() {
  const on = useWorld((s) => s.flowOverlay);
  const set = useWorld((s) => s.setFlowOverlay);
  const path = usePathname();
  const embedded = useEmbedded();
  if (!DEMO_ENABLED || !on || embedded || path.startsWith("/demo")) return null;
  return (
    <aside aria-label={FLOW.title} data-testid="flow-overlay" className="glass glass-strong print:hidden fixed bottom-24 left-3 z-[80] w-[min(92vw,420px)] rounded-[24px] p-3 lg:bottom-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold">{FLOW.title}</h2>
        <button type="button" aria-label={FLOW.overlayClose} onClick={() => set(false)} className="grid size-9 place-items-center rounded-full hover:bg-ink/10"><X className="size-4" /></button>
      </div>
      <MoneyFlow compact />
    </aside>
  );
}
