"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard, GlassSegmented, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { formatINR } from "@/lib/format";
import { LOAN_EVENTS, OPS_LOANS, RECON, type LoanEvent, type OpsLoan, type ReconRecord } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { DataTable, Guarded, OpsPage, Toast, fmtDT, useRole, useToast, type Column } from "./common";

const TABS = [
  { value: "loans", label: "Applications and loans" },
  { value: "events", label: "Failed events" },
  { value: "recon", label: "Reconciliation" },
] as const;

export function LoanMonitoring() {
  const { can } = useRole();
  const flags = useStore((s) => s.ops.reconFlags);
  const retries = useStore((s) => s.ops.retries);
  const escalations = useStore((s) => s.ops.escalations);
  const flagRecon = useStore((s) => s.flagRecon);
  const retryEvent = useStore((s) => s.retryEvent);
  const escalate = useStore((s) => s.escalate);
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("loans");
  const [view, setView] = useState<OpsLoan | null>(null);
  const [retry, setRetry] = useState<LoanEvent | null>(null);
  const [retryNote, setRetryNote] = useState("");
  const [esc, setEsc] = useState(false);
  const [target, setTarget] = useState("");
  const [summary, setSummary] = useState("");
  const [escErr, setEscErr] = useState<string | null>(null);
  const [escRef, setEscRef] = useState<string | null>(null);

  const actionOk = can("loanActions");
  const why = "Only Support agents and Admins can take loan actions.";

  const loanCols: Column<OpsLoan>[] = [
    { key: "id", header: "Loan", cell: (l) => <span className="font-mono font-bold">{l.id}</span> },
    { key: "a", header: "Application", cell: (l) => <span className="font-mono">{l.applicationId}</span> },
    { key: "s", header: "Student", cell: (l) => l.student },
    { key: "p", header: "Product", cell: (l) => l.product },
    { key: "am", header: "Amount", cell: (l) => formatINR(l.amount), className: "text-right tabular-nums" },
    { key: "st", header: "Status", cell: (l) => <span className="font-semibold">{l.status}</span> },
    { key: "o", header: "Outstanding", cell: (l) => formatINR(l.outstanding), className: "text-right tabular-nums" },
    { key: "ac", header: "Outstanding action", cell: (l) => l.action ?? <span className="text-ink-2">None</span> },
  ];
  const eventCols: Column<LoanEvent>[] = [
    { key: "id", header: "Event", cell: (e) => <span className="font-mono font-bold">{e.id}</span> },
    { key: "t", header: "Time", cell: (e) => fmtDT(e.at) },
    { key: "k", header: "Type", cell: (e) => e.kind },
    { key: "l", header: "Loan", cell: (e) => <span className="font-mono">{e.loanId}</span> },
    { key: "a", header: "Amount", cell: (e) => formatINR(e.amount), className: "text-right tabular-nums" },
    { key: "s", header: "Status", cell: (e) => <StatusPill kind="event" value={e.status} /> },
    { key: "n", header: "Retry notes", cell: (e) => retries[e.id] ?? e.retryNote ?? <span className="text-ink-2">None</span> },
    {
      key: "ac",
      header: "Action",
      cell: (e) =>
        e.status === "success" ? null : (
          <Guarded allowed={actionOk} why={why}>
            <GlassButton size="sm" variant="secondary" disabled={!actionOk} onClick={() => { setRetry(e); setRetryNote(""); }}>Add retry note</GlassButton>
          </Guarded>
        ),
    },
  ];
  const reconCols: Column<ReconRecord>[] = [
    { key: "e", header: "Payment event", cell: (r) => <span className="font-mono font-bold">{r.eventId}</span> },
    { key: "a", header: "Event amount", cell: (r) => formatINR(r.eventAmount), className: "text-right tabular-nums" },
    { key: "l", header: "Authoritative record", cell: (r) => (r.ledgerAmount === null ? <span className="text-bad-text">Not found</span> : formatINR(r.ledgerAmount)), className: "text-right tabular-nums" },
    { key: "s", header: "Status", cell: (r) => <StatusPill kind="recon" value={r.status} /> },
    {
      key: "f",
      header: "Flag",
      cell: (r) =>
        r.status === "matched" ? null : flags[r.id] || r.flagged ? (
          <span className="inline-flex items-center gap-1 font-bold text-warn-text"><Flag className="size-3.5" aria-hidden /> Flagged</span>
        ) : (
          <Guarded allowed={can("reconFlag")} why="Only Fraud analysts and Admins can flag a reconciliation mismatch.">
            <GlassButton size="sm" variant="secondary" disabled={!can("reconFlag")} onClick={() => { flagRecon(r.id); toast.show("Mismatch flagged and logged"); }}>Flag mismatch</GlassButton>
          </Guarded>
        ),
    },
  ];

  function submitEsc() {
    if (!target) return setEscErr("Choose who to escalate to.");
    if (summary.trim().length < 10) return setEscErr("Describe the discrepancy (at least 10 characters).");
    setEscErr(null);
    setEscRef(escalate(target, summary.trim()));
  }

  return (
    <OpsPage
      title="Application and loan monitoring"
      desc="Personal data is masked."
      actions={
        <Guarded allowed={actionOk} why={why}>
          <GlassButton size="sm" disabled={!actionOk} onClick={() => { setEsc(true); setEscRef(null); setTarget(""); setSummary(""); }}>Escalate discrepancy</GlassButton>
        </Guarded>
      }
    >
      <GlassSegmented label="View" options={TABS} value={tab} onChange={setTab} className="mb-4 max-w-full overflow-x-auto" />

      {tab === "loans" && <DataTable caption="Applications and loans" columns={loanCols} rows={OPS_LOANS} rowKey={(l) => l.id} onRow={setView} empty="No applications." />}
      {tab === "events" && <DataTable caption="Disbursement and repayment events" columns={eventCols} rows={LOAN_EVENTS.filter((e) => e.status !== "success")} rowKey={(e) => e.id} empty="No failed events." />}
      {tab === "recon" && <DataTable caption="Reconciliation of payment events against authoritative records" columns={reconCols} rows={RECON} rowKey={(r) => r.id} empty="Nothing to reconcile." />}

      {escalations.length > 0 && (
        <GlassCard radius="lg" className="mt-5 p-4" role="region" aria-label="Escalations">
          <h2 className="mb-2 text-sm font-bold">Escalations raised this session</h2>
          <ul className="space-y-1.5 text-sm">{escalations.map((e) => <li key={e.ref} className="flex flex-wrap items-center gap-2"><ReferenceNumber value={e.ref} label="Escalation" /><span className="text-ink-2">to {e.target}: {e.summary}</span></li>)}</ul>
        </GlassCard>
      )}

      <GlassSheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <GlassSheetContent>
          {view && (
            <div className="space-y-3">
              <GlassSheetTitle className="text-xl font-extrabold">Authorised view: {view.id}</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-ink-2">Personal data is masked in this view.</GlassSheetDescription>
              <dl className="divide-y divide-ink/10 rounded-[20px] bg-ink/[0.06] px-4 text-sm">
                {[["Student", view.student], ["Application", view.applicationId], ["Product", view.product], ["Amount", formatINR(view.amount)], ["Status", view.status], ["Outstanding", formatINR(view.outstanding)], ["Outstanding action", view.action ?? "None"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </GlassSheetContent>
      </GlassSheet>

      <GlassSheet open={!!retry} onOpenChange={(o) => !o && setRetry(null)}>
        <GlassSheetContent>
          {retry && (
            <div className="space-y-3">
              <GlassSheetTitle className="text-xl font-extrabold">Retry note for {retry.id}</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-ink-2">Recorded in the audit log.</GlassSheetDescription>
              <Field id="rn" label="Note"><GlassTextarea id="rn" value={retryNote} onChange={(e) => setRetryNote(e.target.value)} className="min-h-24" /></Field>
              <GlassButton size="lg" className="w-full" disabled={retryNote.trim().length < 5} onClick={() => { retryEvent(retry.id, retryNote.trim()); setRetry(null); toast.show("Retry note saved"); }}>Save note</GlassButton>
            </div>
          )}
        </GlassSheetContent>
      </GlassSheet>

      <GlassSheet open={esc} onOpenChange={setEsc}>
        <GlassSheetContent>
          <div className="space-y-3">
            <GlassSheetTitle className="text-xl font-extrabold">Escalate discrepancy</GlassSheetTitle>
            <GlassSheetDescription className="text-sm text-ink-2">Mock form. It creates a reference number and an audit entry.</GlassSheetDescription>
            {escRef ? (
              <div role="status" className="space-y-3 text-center"><p className="text-sm">Escalation created.</p><ReferenceNumber value={escRef} label="Escalation" /><GlassButton size="lg" className="w-full" onClick={() => setEsc(false)}>Done</GlassButton></div>
            ) : (
              <>
                <Field id="et" label="Escalate to" error={escErr}>
                  <GlassSelect id="et" value={target} onChange={(e) => setTarget(e.target.value)} aria-describedby="et-err">
                    <option value="">Choose</option><option>Lender</option><option>Payment provider</option>
                  </GlassSelect>
                </Field>
                <Field id="es" label="Discrepancy summary"><GlassTextarea id="es" value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-24" /></Field>
                <GlassButton size="lg" className="w-full" onClick={submitEsc}>Create escalation</GlassButton>
              </>
            )}
          </div>
        </GlassSheetContent>
      </GlassSheet>
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
