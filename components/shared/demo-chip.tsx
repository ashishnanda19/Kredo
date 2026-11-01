import { FlaskConical } from "lucide-react";
import { COPY } from "@/lib/copy";

/**
 * The always-visible demo tag: a small chip at the bottom-left that keeps the "no real money" notice on screen on
 * every page (the full-width announcement bar that used to carry it was removed from the top of the page). It sits on
 * the same line as the Demo controls button opposite it: above the dashboard tab bar on phones, and clear of the
 * dashboard side rail on desktop (see [data-demo-chip] in globals.css).
 */
export function DemoChip() {
  return (
    <p role="note" data-demo-chip className="fixed bottom-[105px] left-3 z-[80] lg:bottom-[25px] inline-flex items-center gap-1.5 rounded-full bg-[#2a1ba1] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg print:hidden">
      <FlaskConical className="size-3.5" aria-hidden /> {COPY.landing.demoChip}
    </p>
  );
}
