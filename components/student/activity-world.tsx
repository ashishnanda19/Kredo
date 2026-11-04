"use client";

import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { displayedEffect } from "@/lib/aura/engine";
import { ACTIVITY_W } from "@/lib/copy-demo";
import { loansOfStudent, studentEvents } from "@/lib/domain/selectors";
import { fmtDateTime } from "@/lib/domain/time";
import { useWorldStudent } from "./use-student";

interface Item { id: string; at: number; ord: number; text: string; tone: "neutral" | "success" | "danger" | "warning" }

/** Everything on this student's account, newest first: payments, repayments, refunds and Aura changes. */
export function ActivityWorld() {
  const { world, studentId } = useWorldStudent();
  if (!studentId) return null;
  const stall = (id: string) => world.vendors[id]?.stallName ?? "a stall";
  const num = (id: string) => Number(id.split("-").pop()) || 0;
  const items: Item[] = [];
  for (const l of loansOfStudent(world, studentId)) {
    items.push({ id: l.id, at: l.createdAt, ord: num(l.id), text: ACTIVITY_W.paid(l.coins, stall(l.vendorId)), tone: "neutral" });
    if (l.status === "refunded") items.push({ id: `${l.id}-rf`, at: l.closedAt ?? l.createdAt, ord: num(l.id) + 0.5, text: ACTIVITY_W.refunded(l.coins, stall(l.vendorId)), tone: "warning" });
  }
  for (const r of world.repayments.filter((x) => x.studentId === studentId)) items.push({ id: r.id, at: r.at, ord: num(r.id), text: ACTIVITY_W.repaid(r.amount, r.kind === "full"), tone: "success" });
  for (const e of studentEvents(world, studentId)) {
    if (e.delta === 0 || e.at > world.clock.now) continue;
    const eff = displayedEffect(e, world.clock.now).shown;
    items.push({ id: e.id, at: e.at, ord: num(e.id), text: ACTIVITY_W.aura(eff, e.explanation), tone: eff > 0 ? "success" : "danger" });
  }
  const sorted = items.sort((a, b) => b.at - a.at || b.ord - a.ord).slice(0, 60);
  return (
    <div className="space-y-5" data-testid="activity-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{ACTIVITY_W.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{ACTIVITY_W.sub}</p>
      </div>
      <GlassCard radius="lg" className="p-5">
        {sorted.length === 0 ? <p className="py-6 text-center text-sm text-ink-2">{ACTIVITY_W.empty}</p> : (
          <ul className="divide-y divide-hairline">
            {sorted.map((i) => (
              <li key={i.id} data-testid="activity-item" className="flex items-start justify-between gap-3 py-3">
                <p className="min-w-0 text-sm font-semibold">{i.text}</p>
                <Badge tone={i.tone} className="shrink-0">{fmtDateTime(i.at)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
