"use client";

import { ledgerEvents, type LedgerTone } from "@/lib/demo/ledger";
import { fmtDateTime } from "@/lib/domain/time";
import { LEDGER } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";
import { cn } from "@/lib/utils";

const DOT: Record<LedgerTone, string> = { info: "bg-ink-2", good: "bg-ok", warn: "bg-warn", bad: "bg-bad" };

/** "What just happened", in plain English with simulated-clock times. Rebuilt from the world, so Reset clears it. */
export function LedgerStrip({ limit = 8, presenter }: { limit?: number; presenter?: boolean }) {
  const world = useWorld((s) => s.world);
  const items = ledgerEvents(world, { limit });
  return (
    <section aria-label={LEDGER.title} data-testid="ledger-strip" className="rounded-[24px] bg-card p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2">{LEDGER.title}</h2>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-2" data-testid="ledger-empty">{LEDGER.empty}</p>
      ) : (
        <ol aria-live="polite" className="mt-2 space-y-1.5">
          {items.map((e) => (
            <li key={e.id} data-testid="ledger-item" data-kind={e.kind} className={cn("flex items-start gap-2.5", presenter ? "text-lg" : "text-sm")}>
              <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", DOT[e.tone])} />
              <span className="min-w-0 flex-1">{e.text}</span>
              <time className="shrink-0 tabular-nums text-ink-2">{fmtDateTime(e.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
