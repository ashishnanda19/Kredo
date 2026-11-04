"use client";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/glass";
import { exposureOf } from "@/lib/domain/exposure";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DataTable, Kpi, OpsPage, type Column } from "./common";
import type { ExposureRow } from "@/lib/domain/exposure";

/** What students owe the lender and what stalls are still waiting for, by how old it is. Amounts are in rupees (1 coin = ₹1). */
export function ExposureOps() {
  const hydrated = useWorldHydrated();
  const world = useWorld((s) => s.world);
  if (!hydrated) return null;
  const e = exposureOf(world);
  const max = Math.max(1, ...e.buckets.map((b) => b.principal));
  const cols: Column<ExposureRow>[] = [
    { key: "l", header: "Due date", cell: (r) => r.label },
    { key: "n", header: "Payments", cell: (r) => r.loans, className: "tabular-nums" },
    { key: "p", header: "Outstanding principal", cell: (r) => `₹${r.principal}`, className: "tabular-nums" },
    { key: "b", header: "Share", cell: (r) => <span role="img" aria-label={`${Math.round((r.principal / max) * 100)}% of the largest bucket`} className="block h-2 w-40 overflow-hidden rounded-full bg-ink/15"><span className={`block h-full rounded-full ${r.bucket.startsWith("overdue") ? "bg-warn" : "bg-accent"}`} style={{ width: `${(r.principal / max) * 100}%` }} /></span> },
  ];
  return (
    <OpsPage title="Exposure" desc="Principal owed to the lending partner, and what stalls are waiting to be paid. Kredo records these; it holds none of it.">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Outstanding principal" value={`₹${e.outstandingPrincipal}`} hint={`${e.openLoans} open payments`} />
        <Kpi label="Awaiting settlement" value={`₹${e.awaitingSettlement}`} hint={`${e.awaitingPayments} payments`} />
        <Kpi label="30+ days overdue" value={`${e.delinquency30Percent}%`} hint="of outstanding principal" tone={e.delinquency30Percent > 0 ? "warn" : "ok"} />
        <Kpi label="Open payments" value={e.openLoans} />
      </div>
      <DataTable caption="Exposure by due date" columns={cols} rows={e.buckets} rowKey={(r) => r.bucket} loadMs={0} empty="No open payments." />
      <GlassCard radius="lg" className="mt-4 p-4">
        <h2 className="text-base font-bold">Stalls with the most awaiting settlement</h2>
        {e.topVendors.length === 0 ? <p className="py-4 text-sm text-ink-2">Nothing is awaiting settlement.</p> : (
          <ul className="mt-2 divide-y divide-hairline" data-testid="top-vendors">
            {e.topVendors.map((v) => <li key={v.vendorId} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{v.stallName}</span><Badge tone="neutral">₹{v.awaiting}</Badge></li>)}
          </ul>
        )}
      </GlassCard>
    </OpsPage>
  );
}
