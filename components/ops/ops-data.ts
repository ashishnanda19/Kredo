import type { QueueItem, QueueStatus } from "@/lib/mock-ops";
import type { OpsDecision } from "@/lib/store/types";

/** Queue status after any decision made in this demo session. */
export function effectiveStatus(item: QueueItem, decisions: Record<string, OpsDecision>): QueueStatus {
  const d = decisions[item.id];
  if (!d) return item.status;
  return { approved: "accepted", rejected: "failed", escalated: "escalated", info_requested: "pending" }[d.status] as QueueStatus;
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
