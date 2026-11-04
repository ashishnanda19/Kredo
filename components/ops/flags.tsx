"use client";

import { useMemo, useState } from "react";
import { produce } from "immer";
import { GlassButton, GlassCard, GlassSegmented } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { decideFlag } from "@/lib/domain/flags";
import { vendorFacingStudent } from "@/lib/domain/selectors";
import { fmtDateTime } from "@/lib/domain/time";
import type { FraudFlag, FraudFlagKind } from "@/lib/domain/types";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { AccessRestricted, DataTable, Guarded, Kpi, OpsPage, Toast, useRole, useToast, type Column } from "./common";

const KIND: Record<FraudFlagKind, string> = {
  SELF_PAY: "Paying own stall",
  VELOCITY_STUDENT: "Too many payments (student)",
  VELOCITY_VENDOR: "Too many payments (stall)",
  ROUND_CLUSTER: "Round amounts before cut-off",
  CONCENTRATION: "One student, most of a stall's takings",
  SHARED_DEVICE: "Shared device",
};
const FILTERS = [{ value: "open", label: "Open" }, { value: "all", label: "All" }] as const;
const TONE = { open: "warning", confirmed: "danger", dismissed: "neutral" } as const;

/** Payment flags raised by the rules (self-pay, velocity, round amounts, concentration, shared device). Ops confirm or dismiss with a note. */
export function FlagsOps() {
  const hydrated = useWorldHydrated();
  const flags = useWorld((s) => s.world.flags);
  const world = useWorld((s) => s.world);
  const apply = useWorld((s) => s.apply);
  const { role, can, hydrated: roleReady } = useRole();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => [...flags].filter((f) => filter === "all" || f.status === "open").sort((a, b) => b.at - a.at || b.id.localeCompare(a.id)), [flags, filter]);
  const sel = flags.find((f) => f.id === openId);

  if (!hydrated || !roleReady) return null;
  if (!can("fraudPage")) return <AccessRestricted need="Fraud analysts and Admins" />;

  function decide(f: FraudFlag, outcome: "confirmed" | "dismissed") {
    if (!note.trim()) return setError("Add a note so the decision can be understood later.");
    apply((w) => produce(w, (d) => void decideFlag(d, f.id, outcome, `ops:${role}`, note.trim(), d.clock.now)));
    setError(null);
    setNote("");
    toast.show(outcome === "confirmed" ? "Flag confirmed" : "Flag dismissed");
  }

  const cols: Column<FraudFlag>[] = [
    { key: "id", header: "Flag", cell: (f) => <span className="font-mono font-bold">{f.id}</span> },
    { key: "k", header: "Rule", cell: (f) => KIND[f.kind] },
    { key: "s", header: "Student", cell: (f) => vendorFacingStudent(world, f.studentId) },
    { key: "v", header: "Stall", cell: (f) => (f.vendorId ? world.vendors[f.vendorId]?.stallName ?? f.vendorId : "None") },
    { key: "t", header: "Raised", cell: (f) => fmtDateTime(f.at) },
    { key: "st", header: "Status", cell: (f) => <Badge tone={TONE[f.status]}>{f.status}</Badge> },
    { key: "a", header: "", cell: (f) => <GlassButton size="sm" variant="secondary" aria-label={`Review ${f.id}`} onClick={() => { setOpenId(f.id); setNote(""); setError(null); }}>Review</GlassButton> },
  ];

  return (
    <OpsPage title="Payment flags" desc="Rules that look for abuse in payments. A flag never blocks a payment by itself and never moves money; an analyst decides what it means.">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Kpi label="Open" value={flags.filter((f) => f.status === "open").length} tone={flags.some((f) => f.status === "open") ? "warn" : "ok"} />
        <Kpi label="Confirmed" value={flags.filter((f) => f.status === "confirmed").length} />
        <Kpi label="Dismissed" value={flags.filter((f) => f.status === "dismissed").length} />
      </div>
      <div className="mb-3"><GlassSegmented label="Filter flags" options={FILTERS} value={filter} onChange={setFilter} /></div>
      <DataTable caption="Payment flags" columns={cols} rows={rows} rowKey={(f) => f.id} loadMs={0} empty={filter === "open" ? "No open flags. Nothing needs a look right now." : "No flags yet."} />

      {sel && (
        <GlassCard radius="lg" strength="strong" className="mt-4 space-y-3 p-5" role="region" aria-label={`Review ${sel.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-extrabold">{KIND[sel.kind]}</h2>
            <Badge tone={TONE[sel.status]}>{sel.status}</Badge>
          </div>
          <p className="text-sm" data-testid="flag-detail">{sel.detail}</p>
          <dl className="grid gap-1 text-sm sm:grid-cols-2">
            <div><dt className="inline text-ink-2">Student: </dt><dd className="inline">{vendorFacingStudent(world, sel.studentId)}</dd></div>
            <div><dt className="inline text-ink-2">Stall: </dt><dd className="inline">{sel.vendorId ? world.vendors[sel.vendorId]?.stallName : "None"}</dd></div>
            <div><dt className="inline text-ink-2">Raised: </dt><dd className="inline">{fmtDateTime(sel.at)}</dd></div>
            {sel.decidedBy && <div><dt className="inline text-ink-2">Decided by: </dt><dd className="inline">{sel.decidedBy}: {sel.note}</dd></div>}
          </dl>
          {sel.status === "open" && (
            <>
              <label htmlFor="flag-note" className="block text-sm font-semibold">Note (required)</label>
              <textarea id="flag-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-[14px] border border-hairline bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30" />
              {error && <p role="alert" className="text-sm font-medium text-bad-text">{error}</p>}
              <div className="flex gap-2">
                <Guarded allowed={can("fraudPage")} why="Your role can't decide flags.">
                  <GlassButton size="sm" data-testid="flag-confirm" onClick={() => decide(sel, "confirmed")}>Confirm</GlassButton>
                  <GlassButton size="sm" variant="outline" data-testid="flag-dismiss" onClick={() => decide(sel, "dismissed")}>Dismiss</GlassButton>
                </Guarded>
              </div>
            </>
          )}
        </GlassCard>
      )}
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
