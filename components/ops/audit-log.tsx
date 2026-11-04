"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { fmtDateTime } from "@/lib/domain/time";
import type { WorldAuditEntry } from "@/lib/domain/types";
import { csvCell, downloadText } from "@/lib/settlement-report";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DataTable, Guarded, OpsPage, useRole, type Column } from "./common";

const GROUPS: { id: string; label: string; match: (a: string) => boolean }[] = [
  { id: "all", label: "Everything", match: () => true },
  { id: "payment", label: "Payments and repayments", match: (a) => a.startsWith("payment.") || a.startsWith("repayment.") },
  { id: "refund", label: "Refunds", match: (a) => a.startsWith("refund.") },
  { id: "settlement", label: "Settlements", match: (a) => a.startsWith("settlement.") },
  { id: "vendor", label: "Stalls and QR", match: (a) => a.startsWith("vendor.") },
  { id: "fraud", label: "Fraud flags", match: (a) => a.startsWith("fraud.") },
  { id: "limit", label: "Limit overrides and approvals", match: (a) => a.startsWith("limit.") },
  { id: "session", label: "Role switches and sign-ins", match: (a) => a.startsWith("session.") },
];

const details = (a: WorldAuditEntry) => Object.entries(a.details).map(([k, v]) => `${k}: ${String(v)}`).join(", ");

/** The append-only audit log: payments, refunds, overrides, role switches and settlements. Nothing here can be edited or removed. */
export function AuditOps() {
  const hydrated = useWorldHydrated();
  const audit = useWorld((s) => s.world.audit);
  const { can } = useRole();
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const g = GROUPS.find((x) => x.id === group) ?? GROUPS[0];
    const n = q.trim().toLowerCase();
    return audit.filter((a) => g.match(a.action) && (!n || [a.actor, a.action, a.target, details(a)].some((v) => v.toLowerCase().includes(n)))).slice(-300).reverse();
  }, [audit, group, q]);

  if (!hydrated) return null;
  const cols: Column<WorldAuditEntry>[] = [
    { key: "t", header: "Time", cell: (a) => fmtDateTime(a.at) },
    { key: "w", header: "Who", cell: (a) => a.actor },
    { key: "a", header: "Action", cell: (a) => <span className="font-mono">{a.action}</span> },
    { key: "g", header: "Target", cell: (a) => <span className="font-mono">{a.target}</span> },
    { key: "d", header: "Details", cell: (a) => <span className="line-clamp-1 max-w-[360px]">{details(a)}</span> },
  ];
  const csv = () => downloadText("audit-log.csv", [["id", "time", "actor", "action", "target", "details"].join(","), ...rows.map((a) => [a.id, new Date(a.at).toISOString(), a.actor, a.action, a.target, details(a)].map(csvCell).join(","))].join("\n") + "\n", "text/csv");

  return (
    <OpsPage title="Audit log" desc="Append-only. The newest 300 entries that match the filter are shown." actions={<Guarded allowed={can("export")} why="Your role can't export."><GlassButton size="sm" variant="secondary" disabled={!can("export")} data-testid="audit-csv" onClick={csv}><Download className="size-4" aria-hidden /> Export CSV</GlassButton></Guarded>}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">Show
          <select data-testid="audit-group" value={group} onChange={(e) => setGroup(e.target.value)} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
            {GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="min-w-[220px] flex-1 text-sm font-semibold">Search
          <input aria-label="Search the audit log" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Who, action, target or detail" className="ml-2 min-h-11 w-[calc(100%-4.5rem)] rounded-xl border border-hairline bg-card px-3 text-sm" />
        </label>
      </div>
      <DataTable caption="Audit log" columns={cols} rows={rows} rowKey={(a) => a.id} loadMs={0} empty="No entries match." />
    </OpsPage>
  );
}
