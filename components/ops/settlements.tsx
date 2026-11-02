"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { decideRefund } from "@/lib/domain/refunds";
import { fmtDate, fmtDateTime } from "@/lib/domain/time";
import type { Settlement, SettlementStatus } from "@/lib/domain/types";
import { DomainError } from "@/lib/domain/world";
import { reconcileDay, settlementDates, stuckPayments } from "@/lib/reconcile";
import { downloadText, linesCsv, reportJson, summaryCsv } from "@/lib/settlement-report";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DataTable, Guarded, Kpi, OpsPage, Toast, useRole, useToast, type Column } from "./common";

const TONE: Record<SettlementStatus, "neutral" | "warning" | "success" | "danger"> = { scheduled: "neutral", processing: "warning", paid: "success", failed: "danger", on_hold: "warning" };
const LABEL: Record<SettlementStatus, string> = { scheduled: "Scheduled", processing: "Processing", paid: "Paid", failed: "Failed", on_hold: "On hold" };

/** Daily settlement batches, per-vendor status, retry, and reconciliation of instructed, paid and ledger totals. */
export function SettlementsOps() {
  const hydrated = useWorldHydrated();
  const world = useWorld((s) => s.world);
  const apply = useWorld((s) => s.apply);
  const retry = useWorld((s) => s.retrySettlement);
  const { role, can } = useRole();
  const toast = useToast();
  const dates = useMemo(() => settlementDates(world), [world]);
  const [picked, setPicked] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const date = picked && dates.includes(picked) ? picked : dates[0];
  const actor = `ops:${role}`;

  const day = useMemo(() => (date ? reconcileDay(world, date) : null), [world, date]);
  const mismatches = useMemo(() => dates.slice(0, 14).filter((d) => reconcileDay(world, d).mismatch).length, [world, dates]);
  const stuck = stuckPayments(world);
  const pendingRefunds = world.refunds.filter((r) => r.status === "pending_ops");

  const cols: Column<Settlement>[] = [
    { key: "v", header: "Vendor", cell: (s) => <span className="font-semibold">{world.vendors[s.vendorId]?.stallName ?? s.vendorId}</span> },
    { key: "n", header: "Payments", cell: (s) => s.count, className: "tabular-nums" },
    { key: "t", header: "Total", cell: (s) => `₹${s.totalAmount}`, className: "tabular-nums" },
    { key: "a", header: "Adjustments", cell: (s) => (s.adjustmentCoins ? `₹${s.adjustmentCoins}` : "None"), className: "tabular-nums" },
    { key: "s", header: "Status", cell: (s) => <Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge> },
    { key: "r", header: "Reference / reason", cell: (s) => s.reference ?? s.failureReason ?? <span className="text-ink-2">None</span> },
    {
      key: "x",
      header: "",
      cell: (s) =>
        s.status === "failed" || s.status === "on_hold" ? (
          <Guarded allowed={can("settlementRetry")} why="Your role can't retry settlements.">
            <GlassButton size="sm" variant="secondary" data-testid={`retry-${s.id}`} disabled={!can("settlementRetry")} aria-label={`Retry ${s.id}`} onClick={() => void retry(s.id, actor).then(() => toast.show("Sent to the lending partner again"))}>Retry</GlassButton>
          </Guarded>
        ) : null,
    },
  ];

  function decide(id: string, approve: boolean) {
    try {
      apply((w) => decideRefund(w, id, approve, actor, declineReason));
      setRefundError(null);
      setDeclineReason("");
      toast.show(approve ? "Refund approved" : "Refund declined");
    } catch (e) {
      setRefundError(e instanceof DomainError ? e.message : "That didn't work. Try again.");
    }
  }

  if (!hydrated) return null;
  return (
    <OpsPage title="Settlements and reconciliation" desc="Nightly batches reported to the lending partner. Kredo instructs and records; the lending partner pays. Amounts are in rupees (1 coin = ₹1).">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Days with a mismatch (last 14)" value={mismatches} tone={mismatches ? "danger" : "ok"} />
        <Kpi label="Payments in no settlement" value={stuck.length} tone={stuck.length ? "danger" : "ok"} />
        <Kpi label="Failed or on hold" value={Object.values(world.settlements).filter((s) => s.status === "failed" || s.status === "on_hold").length} tone="warn" />
        <Kpi label="Refunds waiting" value={pendingRefunds.length} tone={pendingRefunds.length ? "warn" : undefined} />
      </div>

      {!day ? (
        <p className="rounded-2xl bg-ink/[0.05] px-4 py-8 text-center text-sm text-ink-2">No settlements yet.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold">
              Business date
              <select data-testid="date-select" value={date} onChange={(e) => setPicked(e.target.value)} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
                {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
              </select>
            </label>
            <Guarded allowed={can("export")} why="Your role can't export reports.">
              <div className="flex flex-wrap gap-2">
                <GlassButton size="sm" variant="secondary" disabled={!can("export")} data-testid="dl-summary" onClick={() => downloadText(`settlements-${date}.csv`, summaryCsv(world, day.settlements), "text/csv")}><Download className="size-4" aria-hidden /> Summary CSV</GlassButton>
                <GlassButton size="sm" variant="secondary" disabled={!can("export")} data-testid="dl-lines" onClick={() => downloadText(`settlement-lines-${date}.csv`, linesCsv(world, day.settlements), "text/csv")}><Download className="size-4" aria-hidden /> Payments CSV</GlassButton>
                <GlassButton size="sm" variant="secondary" disabled={!can("export")} data-testid="dl-json-day" onClick={() => downloadText(`settlements-${date}.json`, reportJson(world, day.settlements), "application/json")}><Download className="size-4" aria-hidden /> JSON</GlassButton>
              </div>
            </Guarded>
          </div>

          <GlassCard radius="lg" className="mb-4 p-4" role="region" aria-label="Reconciliation">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">Reconciliation for {fmtDate(day.date)}</h2>
              <Badge tone={day.mismatch ? "danger" : "success"} data-testid="recon-badge">{day.mismatch ? "Mismatch" : "Reconciled"}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-ink-2">Instructed</dt><dd data-testid="recon-instructed" className="text-lg font-bold tabular-nums">₹{day.instructed}</dd></div>
              <div><dt className="text-ink-2">Paid by lender</dt><dd data-testid="recon-paid" className="text-lg font-bold tabular-nums">₹{day.paid}</dd></div>
              <div><dt className="text-ink-2">Sum of payments (ledger)</dt><dd data-testid="recon-ledger" className="text-lg font-bold tabular-nums">₹{day.ledger}</dd></div>
              <div><dt className="text-ink-2">Not yet paid</dt><dd data-testid="recon-outstanding" className="text-lg font-bold tabular-nums">₹{day.outstanding}</dd></div>
            </dl>
            {day.issues.length > 0 && <ul data-testid="recon-issues" className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-bad-text">{day.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
          </GlassCard>

          <DataTable caption="Settlements for the day" columns={cols} rows={day.settlements} rowKey={(s) => s.id} loadMs={0} empty="No settlements for this date." />
        </>
      )}

      <section aria-labelledby="refunds-h" className="mt-6">
        <h2 id="refunds-h" className="mb-2 text-base font-bold">Refunds waiting for approval</h2>
        {pendingRefunds.length === 0 ? (
          <p className="rounded-2xl bg-ink/[0.05] px-4 py-6 text-center text-sm text-ink-2">Nothing is waiting.</p>
        ) : (
          <GlassCard radius="lg" className="p-4">
            <ul className="divide-y divide-hairline" data-testid="refund-queue">
              {pendingRefunds.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{world.vendors[r.vendorId]?.stallName} · ₹{r.coins}</p>
                    <p className="text-ink-2">{r.reason} · {fmtDateTime(r.requestedAt)}</p>
                  </div>
                  <Guarded allowed={can("refundDecide")} why="Your role can't decide refunds.">
                    <div className="flex gap-2">
                      <GlassButton size="sm" data-testid={`approve-${r.id}`} disabled={!can("refundDecide")} onClick={() => decide(r.id, true)}>Approve</GlassButton>
                      <GlassButton size="sm" variant="outline" data-testid={`decline-${r.id}`} disabled={!can("refundDecide")} onClick={() => decide(r.id, false)}>Decline</GlassButton>
                    </div>
                  </Guarded>
                </li>
              ))}
            </ul>
            <label className="mt-2 block text-sm font-semibold" htmlFor="decline-reason">Reason (needed to decline)</label>
            <input id="decline-reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} className="mt-1 min-h-11 w-full rounded-[14px] border border-hairline bg-card px-3 text-sm" />
            {refundError && <p role="alert" className="mt-2 text-sm font-medium text-bad-text">{refundError}</p>}
          </GlassCard>
        )}
      </section>
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
