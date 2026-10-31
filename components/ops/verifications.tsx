"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { GlassSegmented } from "@/components/glass";
import { MaskedValue } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { QUEUE, REJECTION, type QueueItem } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { DataTable, OpsPage, fmtDT, type Column } from "./common";
import { effectiveStatus } from "./ops-data";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "escalated", label: "Escalated" },
] as const;

function Queue() {
  const router = useRouter();
  const params = useSearchParams();
  const decisions = useStore((s) => s.ops.decisions);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return QUEUE.filter((r) => filter === "all" || effectiveStatus(r, decisions) === filter).filter((r) => !n || [r.id, r.mobile, r.idMasked].some((v) => v.toLowerCase().includes(n)));
  }, [q, filter, decisions]);

  const cols: Column<QueueItem>[] = [
    { key: "id", header: "Application", cell: (r) => <span className="font-mono font-bold">{r.id}</span> },
    { key: "m", header: "Mobile", cell: (r) => <MaskedValue value={r.mobile} label="Mobile" /> },
    { key: "i", header: "College ID", cell: (r) => <MaskedValue value={r.idMasked} label="College ID" /> },
    { key: "c", header: "College", cell: (r) => <span className="line-clamp-1 max-w-[220px]">{r.college}</span> },
    { key: "s", header: "Submitted", cell: (r) => fmtDT(r.submitted) },
    { key: "st", header: "Status", cell: (r) => <StatusPill kind="queue" value={effectiveStatus(r, decisions)} /> },
    { key: "r", header: "Reason", cell: (r) => (r.reason ? REJECTION[r.reason].label : <span className="text-ink-2">None</span>) },
    { key: "a", header: "Assignee", cell: (r) => r.assignee ?? <span className="text-ink-2">Unassigned</span> },
  ];

  return (
    <OpsPage title="Verification review queue" desc="Search by application ID or a masked identifier. Full identifiers are never shown.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search queue" placeholder="APP-10421, +91 98••• or ••••2041" className="glass glass-soft min-h-11 w-full rounded-full pl-10 pr-4 text-sm focus-visible:outline-none" />
        </div>
        <GlassSegmented label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <DataTable caption="Verification queue" columns={cols} rows={rows} rowKey={(r) => r.id} onRow={(r) => router.push(`/ops/verifications/${r.id}`)} empty="Nothing matches. Try another filter or search." />
      <p className="mt-2 text-xs text-ink-2">Select a row to open the review.</p>
    </OpsPage>
  );
}

export function VerificationQueue() {
  return (
    <Suspense fallback={<p role="status" className="py-10 text-center text-ink-2">Loading…</p>}>
      <Queue />
    </Suspense>
  );
}
