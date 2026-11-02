/**
 * Read-only views of the world. Everything a screen shows is computed here from the ledger, never stored twice, so
 * the numbers cannot drift apart.
 *
 * MONEY BOUNDARY: "available limit" is the sanctioned limit minus outstanding principal. It is the only thing a
 * student sees as coins. A vendor's coins are a receivable. There is no wallet in this module or anywhere else.
 */
import { deriveState, type StudentState } from "../aura/engine";
import { getPolicy } from "../policy";
import { daysBetween, daysPastDue, fmtDate, istDate } from "./time";
import type { Loan, ScoreEvent, VendorReceivable, WorldState } from "./types";

export const studentEvents = (w: WorldState, studentId: string): ScoreEvent[] => w.scoreEvents.filter((e) => e.studentId === studentId);

export const studentState = (w: WorldState, studentId: string, at: number = w.clock.now): StudentState => deriveState(studentEvents(w, studentId), at);

export const loansOfStudent = (w: WorldState, studentId: string): Loan[] =>
  Object.values(w.loans).filter((l) => l.studentId === studentId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

export const loansOfVendor = (w: WorldState, vendorId: string): Loan[] =>
  Object.values(w.loans).filter((l) => l.vendorId === vendorId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

/** What is still owed on a loan, in rupees (principal + fee + interest, less refunds and repayments). */
export const amountDue = (l: Loan): number => (l.status === "paid" || l.status === "refunded" ? 0 : Math.max(0, l.totalRepayable - l.refundedCoins - l.repaid));

/** Principal still outstanding. Repayments clear the fee, then the interest, then the principal. */
export function principalOutstanding(l: Loan): number {
  if (l.status === "paid" || l.status === "refunded") return 0;
  const principalPaid = Math.max(0, l.repaid - l.fee - l.interest);
  return Math.max(0, l.coins - l.refundedCoins - principalPaid);
}

export const isOpen = (l: Loan) => l.status === "active" || l.status === "overdue" || l.status === "defaulted";

export const outstandingPrincipalOf = (w: WorldState, studentId: string): number => loansOfStudent(w, studentId).reduce((s, l) => s + principalOutstanding(l), 0);

/** Loans past the grace period and still unpaid (overdue or defaulted). */
export const pastGraceLoans = (w: WorldState, studentId: string, at: number = w.clock.now): Loan[] =>
  loansOfStudent(w, studentId).filter((l) => isOpen(l) && daysPastDue(l.dueDate, at) > getPolicy().repayment.graceDays);

export const hasOverdue = (w: WorldState, studentId: string, at: number = w.clock.now): boolean => pastGraceLoans(w, studentId, at).length > 0;

export type BlockCode = "LOW_AURA" | "PAST_DUE";

/** Why new spends are blocked, if they are: Aura below the threshold, or any loan past grace. Calm wording, never shaming. */
export function blockedReason(w: WorldState, studentId: string, at: number = w.clock.now): { code: BlockCode; message: string } | null {
  const p = getPolicy();
  const past = pastGraceLoans(w, studentId, at);
  if (past.length) {
    const owed = past.reduce((s, l) => s + amountDue(l), 0);
    return { code: "PAST_DUE", message: `New spends are paused because ${owed} coins (₹${owed}) is past its due date. Paying it lifts the pause.` };
  }
  if (studentState(w, studentId, at).aura < p.aura.blockBelowAura) {
    return { code: "LOW_AURA", message: "New spends are paused while your Aura is below the minimum. Repaying on time and the recovery steps raise it." };
  }
  return null;
}

/** Sanctioned limit minus outstanding principal, never below zero. */
export function availableLimit(w: WorldState, studentId: string, at: number = w.clock.now): number {
  const s = studentState(w, studentId, at);
  return Math.max(0, s.limit - outstandingPrincipalOf(w, studentId));
}

/** What the coin card shows: the available limit, or zero while spends are blocked. */
export const spendableCoins = (w: WorldState, studentId: string, at: number = w.clock.now): number => (blockedReason(w, studentId, at) ? 0 : availableLimit(w, studentId, at));

/** Percent of the sanctioned limit in use. */
export function utilisationPercent(w: WorldState, studentId: string, at: number = w.clock.now): number {
  const s = studentState(w, studentId, at);
  return s.limit ? (outstandingPrincipalOf(w, studentId) / s.limit) * 100 : 0;
}

export type DisplayStatus = "upcoming" | "due_today" | "overdue" | "paid" | "defaulted" | "refunded";

export function displayStatus(l: Loan, now: number): DisplayStatus {
  if (l.status === "paid") return "paid";
  if (l.status === "refunded") return "refunded";
  if (l.status === "defaulted") return "defaulted";
  if (daysPastDue(l.dueDate, now) > getPolicy().repayment.graceDays) return "overdue";
  // on the due date, and during the one-day grace after it, the loan is "due today"
  return istDate(now) >= l.dueDate ? "due_today" : "upcoming";
}

export const dueInDays = (l: Loan, now: number) => daysBetween(istDate(now), l.dueDate);

/** The student's next repayment: the open loan due soonest. */
export function nextDue(w: WorldState, studentId: string): Loan | null {
  const open = loansOfStudent(w, studentId).filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt - b.createdAt);
  return open[0] ?? null;
}

// vendor side ----------------------------------------------------------------------------------------------------

/** Coins a vendor has received and the lender has not yet paid out. */
export const awaitingSettlement = (w: WorldState, vendorId: string): number =>
  loansOfVendor(w, vendorId).filter((l) => l.vendorStatus === "received").reduce((s, l) => s + (l.coins - l.refundedCoins), 0);

/** Receivables by business date, newest first. */
export function receivablesOf(w: WorldState, vendorId: string): VendorReceivable[] {
  const byDate = new Map<string, VendorReceivable>();
  for (const l of loansOfVendor(w, vendorId)) {
    if (l.vendorStatus === "refunded") continue;
    const date = istDate(l.createdAt);
    const cur = byDate.get(date) ?? { vendorId, date, totalCoins: 0, status: "settled" as const };
    cur.totalCoins += l.coins - l.refundedCoins;
    if (l.vendorStatus === "received") cur.status = "awaiting_settlement";
    else cur.settlementId = cur.settlementId ?? l.settlementId;
    byDate.set(date, cur);
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Coins received on one India-time date. */
export const receivedOn = (w: WorldState, vendorId: string, date: string): { coins: number; count: number } => {
  const ls = loansOfVendor(w, vendorId).filter((l) => istDate(l.createdAt) === date && l.vendorStatus !== "refunded");
  return { coins: ls.reduce((s, l) => s + l.coins - l.refundedCoins, 0), count: ls.length };
};

/** First name and last initial only, with the masked ID tail: all a vendor ever sees of a student. */
export function vendorFacingStudent(w: WorldState, studentId: string): string {
  const s = w.students[studentId];
  return s ? `${s.firstName} ${s.lastInitial}. (${s.idMasked.slice(-4)})` : "Student";
}

/** "Settles at 12:00 midnight tonight" / "Settled on 2 Nov, ref SET-..." for the vendor's home card. */
export function settlementStatusLine(w: WorldState, vendorId: string): string {
  const mine = Object.values(w.settlements).filter((s) => s.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date));
  const awaiting = awaitingSettlement(w, vendorId);
  if (awaiting > 0) return "Settles at 12:00 midnight tonight";
  const last = mine[0];
  if (!last) return "No settlements yet";
  if (last.status === "paid") return `Settled on ${fmtDate(last.date)}, ref ${last.reference ?? last.id}`;
  if (last.status === "failed") return `Settlement for ${fmtDate(last.date)} failed: ${last.failureReason ?? "the lender will retry"}`;
  if (last.status === "on_hold") return `Settlement for ${fmtDate(last.date)} is on hold`;
  return `Settlement for ${fmtDate(last.date)} is ${last.status}`;
}
