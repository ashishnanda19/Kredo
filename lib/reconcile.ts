/**
 * Reconciliation (docs/MVP_DEMO_PROMPT.md, B14): for each business date, the total Kredo INSTRUCTED the lender to pay,
 * the total the lender PAID, and the sum of the PAYMENTS in the ledger. Any mismatch is flagged with a plain reason.
 *
 * "Unpaid" money (failed, on hold, still processing) is not a mismatch; it is shown separately as outstanding.
 */
import { batchDate, DAY, HOUR, istDate, istStartOf } from "./domain/time";
import type { Settlement, WorldState } from "./domain/types";
import { getPolicy } from "./policy";

export interface DayRecon {
  date: string;
  instructed: number;
  paid: number;
  /** Rebuilt from the loans and adjustments the settlements point to, not from the settlement's own total. */
  ledger: number;
  /** Instructed but not (yet) paid: failed, on hold, scheduled or processing. */
  outstanding: number;
  count: number;
  settlements: Settlement[];
  issues: string[];
  mismatch: boolean;
}

/** Everything wrong with one settlement, or an empty list. */
export function settlementIssues(w: WorldState, s: Settlement): string[] {
  const issues: string[] = [];
  const loans = s.loanIds.map((id) => w.loans[id]);
  if (loans.some((l) => !l)) return [`${s.id}: a payment it lists is missing from the ledger.`];
  const gross = loans.reduce((a, l) => a + l.coins, 0);
  if (gross !== s.grossCoins) issues.push(`${s.id}: payments add up to ${gross} but the instruction says ${s.grossCoins}.`);
  if (loans.some((l) => l.vendorId !== s.vendorId)) issues.push(`${s.id}: lists a payment that belongs to another stall.`);
  const adj = s.adjustmentIds.map((id) => w.adjustments.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
  const adjSum = adj.reduce((a, x) => a + x.coins, 0);
  if (adj.length !== s.adjustmentIds.length || adjSum !== s.adjustmentCoins) issues.push(`${s.id}: adjustments add up to ${adjSum} but the instruction says ${s.adjustmentCoins}.`);
  if (s.totalAmount !== gross - s.refundCoins + adjSum) issues.push(`${s.id}: the total ${s.totalAmount} is not payments less refunds plus adjustments (${gross - s.refundCoins + adjSum}).`);
  if (s.status === "paid" && !s.reference) issues.push(`${s.id}: marked paid but has no bank reference.`);
  if (s.status === "paid" && loans.some((l) => l.vendorStatus === "received")) issues.push(`${s.id}: paid, but a payment in it still shows as awaiting settlement.`);
  if (s.status !== "paid" && loans.some((l) => l.vendorStatus === "settled")) issues.push(`${s.id}: not paid, but a payment in it shows as settled.`);
  return issues;
}

export function reconcileDay(w: WorldState, date: string): DayRecon {
  const delay = getPolicy().settlement.delayHours * HOUR;
  const settlements = Object.values(w.settlements).filter((s) => s.date === date).sort((a, b) => a.vendorId.localeCompare(b.vendorId));
  const issues = settlements.flatMap((s) => settlementIssues(w, s));
  const instructed = settlements.reduce((a, s) => a + s.totalAmount, 0);
  const paid = settlements.filter((s) => s.status === "paid").reduce((a, s) => a + s.totalAmount, 0);
  const ledger = settlements.reduce((a, s) => {
    const gross = s.loanIds.reduce((x, id) => x + (w.loans[id]?.coins ?? 0), 0);
    const adj = s.adjustmentIds.reduce((x, id) => x + (w.adjustments.find((q) => q.id === id)?.coins ?? 0), 0);
    return a + gross - s.refundCoins + adj;
  }, 0);

  // a payment from that day that closed its day but is in no settlement
  const start = istStartOf(date, 0);
  {
    const inSome = new Set(Object.values(w.settlements).flatMap((s) => s.loanIds));
    for (const l of Object.values(w.loans)) {
      if (l.createdAt >= start && l.createdAt < start + DAY && l.vendorStatus !== "refunded" && l.createdAt + delay <= w.clock.now && !inSome.has(l.id)) issues.push(`Payment ${l.id} from ${date} is in no settlement.`);
    }
  }
  if (instructed !== ledger) issues.push(`Instructed ${instructed} but the ledger adds up to ${ledger}.`);
  if (paid > instructed) issues.push(`Paid ${paid} is more than the ${instructed} instructed.`);
  return { date, instructed, paid, ledger, outstanding: instructed - paid, count: settlements.length, settlements, issues, mismatch: issues.length > 0 };
}

/** Business dates that have at least one settlement, newest first. */
export const settlementDates = (w: WorldState): string[] => [...new Set(Object.values(w.settlements).map((s) => s.date))].sort().reverse();

/** Payments past their settlement time that no settlement picked up. Should always be empty. */
export function stuckPayments(w: WorldState) {
  const inSome = new Set(Object.values(w.settlements).flatMap((s) => s.loanIds));
  return Object.values(w.loans).filter((l) => l.vendorStatus === "received" && l.createdAt + getPolicy().settlement.delayHours * HOUR <= w.clock.now && !inSome.has(l.id));
}

export { batchDate, istDate };
