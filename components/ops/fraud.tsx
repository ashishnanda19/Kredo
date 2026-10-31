"use client";

import { useState } from "react";
import { Field } from "@/components/forms/field";
import { GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { FRAUD_ALERTS, type FraudAlert, type FraudOutcome, type FraudStatus } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { AccessRestricted, DataTable, OpsPage, Toast, fmtDT, useRole, useToast, type Column } from "./common";

const OUTCOME: Record<Exclude<FraudOutcome, null>, string> = { confirmed: "Confirmed", false_positive: "False positive", inconclusive: "Inconclusive" };

export function FraudMonitoring() {
  const { can, hydrated } = useRole();
  const over = useStore((s) => s.ops.fraud);
  const update = useStore((s) => s.fraudUpdate);
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (!hydrated) return <p role="status" className="py-10 text-center text-muted">Loading…</p>;
  if (!can("fraudPage")) return <AccessRestricted need="Fraud analysts and Admins" />;

  const eff = (a: FraudAlert) => ({ status: over[a.id]?.status ?? a.status, outcome: over[a.id]?.outcome === undefined ? a.outcome : over[a.id].outcome, notes: [...a.notes, ...(over[a.id]?.notes ?? [])] });
  const alert = FRAUD_ALERTS.find((a) => a.id === openId) ?? null;
  const e = alert ? eff(alert) : null;

  const cols: Column<FraudAlert>[] = [
    { key: "id", header: "Alert", cell: (a) => <span className="font-mono font-bold">{a.id}</span> },
    { key: "t", header: "Type", cell: (a) => a.type },
    { key: "s", header: "Summary", cell: (a) => <span className="line-clamp-1">{a.summary}</span> },
    { key: "app", header: "Application", cell: (a) => <span className="font-mono">{a.applicationId}</span> },
    { key: "r", header: "Raised", cell: (a) => fmtDT(a.raisedAt) },
    { key: "n", header: "Indicators", cell: (a) => a.indicators.length },
    { key: "st", header: "Status", cell: (a) => <StatusPill kind="fraud" value={eff(a).status} /> },
    { key: "o", header: "Outcome", cell: (a) => (eff(a).outcome ? OUTCOME[eff(a).outcome as Exclude<FraudOutcome, null>] : <span className="text-muted">Open</span>) },
  ];

  function act(patch: { status?: FraudStatus; outcome?: FraudOutcome; note?: string }, msg: string) {
    if (!alert) return;
    update(alert.id, patch);
    toast.show(msg);
  }

  return (
    <OpsPage title="Fraud monitoring" desc="Alerts show indicators with their source and time. Detection rules and thresholds are never shown.">
      <DataTable caption="Fraud alerts" columns={cols} rows={FRAUD_ALERTS} rowKey={(a) => a.id} onRow={(a) => setOpenId(a.id)} empty="No alerts right now." />
      <p className="mt-2 text-xs text-muted">Select a row to investigate.</p>

      <GlassSheet open={!!alert} onOpenChange={(o) => !o && setOpenId(null)}>
        <GlassSheetContent className="md:max-w-xl">
          {alert && e && (
            <div className="space-y-4">
              <div>
                <GlassSheetTitle className="text-xl font-extrabold"><span className="font-mono">{alert.id}</span> · {alert.type}</GlassSheetTitle>
                <GlassSheetDescription className="text-sm text-muted">Application {alert.applicationId} · raised {fmtDT(alert.raisedAt)}</GlassSheetDescription>
              </div>
              <div className="flex items-center gap-2"><StatusPill kind="fraud" value={e.status} />{e.outcome && <span className="text-sm font-bold">{OUTCOME[e.outcome]}</span>}</div>

              <section aria-label="Risk indicators">
                <h3 className="mb-1 text-sm font-bold">Risk indicators</h3>
                <ul className="space-y-2">
                  {alert.indicators.map((i) => (
                    <li key={i.label} className="rounded-2xl bg-foreground/[0.06] px-3 py-2 text-sm">
                      <p className="font-semibold">{i.label}</p>
                      <p className="text-xs text-muted">Source: {i.source} · {fmtDT(i.at)}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-label="Notes">
                <h3 className="mb-1 text-sm font-bold">Notes</h3>
                {e.notes.length === 0 ? <p className="text-sm text-muted">No notes yet.</p> : (
                  <ul className="space-y-1.5 text-sm">{e.notes.map((n, i) => <li key={i} className="rounded-xl bg-foreground/[0.05] px-3 py-2"><span className="font-semibold">{n.by}</span> · <span className="text-xs text-muted">{fmtDT(n.at)}</span><br />{n.text}</li>)}</ul>
                )}
                <div className="mt-2 space-y-2">
                  <Field id="fnote" label="Add a note"><GlassTextarea id="fnote" value={note} onChange={(ev) => setNote(ev.target.value)} className="min-h-20" /></Field>
                  <GlassButton size="sm" variant="secondary" disabled={note.trim().length < 3} onClick={() => { act({ note: note.trim() }, "Note added and logged"); setNote(""); }}>Add note</GlassButton>
                </div>
              </section>

              <section aria-label="Analyst actions" className="space-y-2">
                <h3 className="text-sm font-bold">Analyst actions</h3>
                <div className="flex flex-wrap gap-2">
                  <GlassButton size="sm" variant="secondary" onClick={() => act({ status: "investigating" }, "Marked as investigating")}>Investigate</GlassButton>
                  <GlassButton size="sm" variant="secondary" onClick={() => act({ status: "escalated" }, "Escalated")}>Escalate</GlassButton>
                </div>
                <p className="text-xs font-bold text-muted">Mark outcome (closes the alert)</p>
                <div className="flex flex-wrap gap-2">
                  <GlassButton size="sm" onClick={() => act({ status: "closed", outcome: "confirmed" }, "Outcome recorded: confirmed")}>Confirmed</GlassButton>
                  <GlassButton size="sm" variant="soft" onClick={() => act({ status: "closed", outcome: "false_positive" }, "Recorded as a false positive for process improvement")}>False positive</GlassButton>
                  <GlassButton size="sm" variant="secondary" onClick={() => act({ status: "closed", outcome: "inconclusive" }, "Outcome recorded: inconclusive")}>Inconclusive</GlassButton>
                </div>
                <p className="text-xs text-muted">False positives are recorded so the process can be improved. Every action is written to the audit log.</p>
              </section>
            </div>
          )}
        </GlassSheetContent>
      </GlassSheet>
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
