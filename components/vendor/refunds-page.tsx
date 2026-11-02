"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { REFUND } from "@/lib/copy-demo";
import { DAY, fmtDateTime } from "@/lib/domain/time";
import { vendorFacingStudent } from "@/lib/domain/selectors";
import { getPolicy } from "@/lib/policy";
import { useWorld } from "@/lib/store/world";

const TONE = { done: "success", pending_ops: "warning", declined: "danger" } as const;

export function RefundsPage() {
  const world = useWorld((s) => s.world);
  const vendorId = useWorld((s) => s.session.vendorId);
  if (!vendorId) return null;
  const mine = world.refunds.filter((r) => r.vendorId === vendorId).sort((a, b) => b.requestedAt - a.requestedAt);
  const used = mine.filter((r) => r.status !== "declined" && r.requestedAt > world.clock.now - 7 * DAY).length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{REFUND.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{REFUND.sub} <Link href="/vendor/payments" className="underline">Payments</Link></p>
        <p className="mt-1 text-xs text-ink-2" data-testid="refund-cap">{REFUND.cap(used, getPolicy().refunds.maxPerVendorPer7Days)}</p>
      </div>
      <GlassCard radius="lg" className="p-5">
        {mine.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-2">{REFUND.empty}</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {mine.map((r) => (
              <li key={r.id} data-testid="refund-row" data-status={r.status} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{vendorFacingStudent(world, r.studentId)}</p>
                  <p className="text-xs text-ink-2">{fmtDateTime(r.requestedAt)} · {r.reason}</p>
                  {r.mode && <p className="text-xs text-ink-2">{REFUND.modeNote[r.mode]}</p>}
                  {r.declineReason && <p className="text-xs text-ink-2">{REFUND.declinedWhy(r.declineReason)}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="font-bold tabular-nums">{r.coins}</p>
                  <Badge tone={TONE[r.status]}>{REFUND.status[r.status]}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
