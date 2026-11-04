/**
 * Exposure for ops: how much is owed and how old it is. Outstanding principal (what students still owe the lender,
 * before fees and interest), what vendors have received but is not yet settled, and both by due-date bucket.
 */
import { principalOutstanding, isOpen } from "./selectors";
import { daysBetween, daysPastDue, istDate } from "./time";
import type { WorldState } from "./types";
import { getPolicy } from "../policy";

export type BucketId = "not_due" | "due_week" | "overdue_1_7" | "overdue_8_30" | "overdue_30_plus";

export const BUCKETS: { id: BucketId; label: string }[] = [
  { id: "not_due", label: "Due in more than 7 days" },
  { id: "due_week", label: "Due in the next 7 days" },
  { id: "overdue_1_7", label: "Overdue 1 to 7 days" },
  { id: "overdue_8_30", label: "Overdue 8 to 30 days" },
  { id: "overdue_30_plus", label: "Overdue more than 30 days" },
];

export interface ExposureRow {
  bucket: BucketId;
  label: string;
  loans: number;
  principal: number;
}

export interface Exposure {
  outstandingPrincipal: number;
  openLoans: number;
  awaitingSettlement: number;
  awaitingPayments: number;
  buckets: ExposureRow[];
  /** Share of outstanding principal that is more than 30 days overdue. */
  delinquency30Percent: number;
  topVendors: { vendorId: string; stallName: string; awaiting: number }[];
}

export function bucketOf(dueDate: string, now: number): BucketId {
  const dpd = daysPastDue(dueDate, now);
  if (dpd > getPolicy().repayment.defaultAfterDays) return "overdue_30_plus";
  if (dpd > 7) return "overdue_8_30";
  if (dpd > 0) return "overdue_1_7";
  return daysBetween(istDate(now), dueDate) <= 7 ? "due_week" : "not_due";
}

export function exposureOf(w: WorldState): Exposure {
  const now = w.clock.now;
  const rows = new Map<BucketId, ExposureRow>(BUCKETS.map((b) => [b.id, { bucket: b.id, label: b.label, loans: 0, principal: 0 }]));
  let principal = 0;
  let open = 0;
  for (const l of Object.values(w.loans)) {
    if (!isOpen(l)) continue;
    const owed = principalOutstanding(l);
    principal += owed;
    open++;
    const r = rows.get(bucketOf(l.dueDate, now))!;
    r.loans++;
    r.principal += owed;
  }
  const awaitingByVendor = new Map<string, number>();
  let awaiting = 0;
  let awaitingPayments = 0;
  for (const l of Object.values(w.loans)) {
    if (l.vendorStatus !== "received") continue;
    const net = l.coins - l.refundedCoins;
    awaiting += net;
    awaitingPayments++;
    awaitingByVendor.set(l.vendorId, (awaitingByVendor.get(l.vendorId) ?? 0) + net);
  }
  const old = rows.get("overdue_30_plus")!.principal;
  return {
    outstandingPrincipal: principal,
    openLoans: open,
    awaitingSettlement: awaiting,
    awaitingPayments,
    buckets: [...rows.values()],
    delinquency30Percent: principal ? Math.round((old / principal) * 1000) / 10 : 0,
    topVendors: [...awaitingByVendor.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([vendorId, v]) => ({ vendorId, stallName: w.vendors[vendorId]?.stallName ?? vendorId, awaiting: v })),
  };
}
