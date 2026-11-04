/**
 * The settlement job (docs/MVP_DEMO_PROMPT.md, B9).
 *
 * Twelve hours after each payment (policy.settlement.delayHours) Kredo produces a SETTLEMENT INSTRUCTION for that payment:
 * a report the lending partner (NBFC) acts on. THIS MODULE NEVER MOVES MONEY. The lender pays the vendor; Kredo only
 * records and reports. The one outward call is `NbfcPort.submitSettlement` (lib/api/nbfc-port.ts), and a unit test
 * asserts that boundary.
 *
 * The job is idempotent: a settlement id is `vendor + payment`, so running it twice creates nothing new.
 */
import type { NbfcPort, SettlementInstruction, SettlementResult } from "./api/nbfc-port";
import { NOTE } from "./copy-demo";
import { appendAudit } from "./domain/audit";
import { HOUR, istDate } from "./domain/time";
import { getPolicy } from "./policy";
import type { Settlement, WorldState } from "./domain/types";

export const settlementId = (vendorId: string, loanId: string) => `SET-${vendorId}-${loanId}`;

/**
 * Builds a settlement for every payment received at least `delayHours` before `now` and not yet settled. Mutates the
 * given (draft) world. Returns the ids it created; ids that already existed are left alone.
 *
 *  - A payment refunded before settlement is never reported as owed.
 *  - A refund after settlement is a negative adjustment, netted into that stall's next settlement.
 *  - Adjustments only apply while the settlement stays at or above zero; the rest carry to the next one.
 */
export function buildSettlements(w: WorldState, now: number, delayHours: number = getPolicy().settlement.delayHours): string[] {
  const due = Object.values(w.loans)
    .filter((l) => l.vendorStatus === "received" && !l.settlementId && l.createdAt + delayHours * HOUR <= now)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  const created: string[] = [];
  for (const l of due) {
    const id = settlementId(l.vendorId, l.id);
    if (w.settlements[id]) continue; // idempotent
    const at = l.createdAt + delayHours * HOUR;
    let net = l.coins - l.refundedCoins;

    const adjustmentIds: string[] = [];
    let adjustmentCoins = 0;
    for (const a of w.adjustments.filter((x) => x.vendorId === l.vendorId && !x.settlementId && x.createdAt <= at).sort((x, y) => x.createdAt - y.createdAt)) {
      if (net + a.coins < 0) break;
      net += a.coins;
      adjustmentCoins += a.coins;
      adjustmentIds.push(a.id);
    }

    const date = istDate(l.createdAt);
    const settlement: Settlement = {
      id, vendorId: l.vendorId, date, grossCoins: l.coins, refundCoins: l.refundedCoins, adjustmentCoins, totalAmount: net,
      count: 1, loanIds: [l.id], adjustmentIds, bankMasked: w.vendors[l.vendorId]?.bankMasked ?? "",
      status: "scheduled", createdAt: at, updatedAt: at,
    };
    w.settlements[id] = settlement;
    l.settlementId = id;
    for (const a of w.adjustments) if (adjustmentIds.includes(a.id)) a.settlementId = id;
    w.seq += 1;
    w.audit = appendAudit(w.audit, { at, actor: "system", action: "settlement.created", target: id, details: { vendorId: l.vendorId, date, total: net, count: 1 } }, w.seq);
    created.push(id);
  }
  return created;
}

/** The instruction the lender receives for a settlement. Plain data; sending it is the only outward step. */
export function toInstruction(s: Settlement): SettlementInstruction {
  return { settlementId: s.id, vendorId: s.vendorId, date: s.date, amountRupees: s.totalAmount, paymentCount: s.count, bankMasked: s.bankMasked, paymentIds: [...s.loanIds] };
}

/** Marks a settlement as handed to the lender. */
export function markProcessing(w: WorldState, id: string, at: number): void {
  const s = w.settlements[id];
  if (!s || s.status === "paid" || s.status === "processing") return;
  s.status = "processing";
  s.updatedAt = at;
}

/**
 * Records the lender's answer. `paid` is final and idempotent: re-applying it changes nothing. Only a paid settlement
 * moves the vendor's payments from received to settled; a failed or held one leaves them awaiting settlement.
 */
export function applySettlementResult(w: WorldState, id: string, result: SettlementResult, at: number): boolean {
  const s = w.settlements[id];
  if (!s || s.status === "paid") return false;
  s.status = result.status;
  s.updatedAt = at;
  s.reference = result.status === "paid" ? result.reference : s.reference;
  s.failureReason = result.status === "paid" ? undefined : result.failureReason;
  if (result.status === "paid") for (const lid of s.loanIds) if (w.loans[lid].vendorStatus === "received") w.loans[lid].vendorStatus = "settled";
  const account = w.vendors[s.vendorId]?.accountId;
  if (account && result.status !== "on_hold") {
    w.seq += 1;
    const text = result.status === "paid" ? NOTE.settlementPaid(s.totalAmount, s.date, result.reference) : NOTE.settlementFailed(s.date, result.failureReason);
    w.notifications.push({ id: `N-${String(w.seq).padStart(5, "0")}`, at, accountId: account, kind: "settlement", title: text.title, body: text.body });
  }
  w.seq += 1;
  w.audit = appendAudit(w.audit, { at, actor: "lender", action: `settlement.${result.status}`, target: id, details: { reference: result.reference ?? "", reason: result.failureReason ?? "" } }, w.seq);
  return true;
}

/** Ops retry: a failed or held settlement goes back to scheduled to be submitted again. */
export function retrySettlement(w: WorldState, id: string, at: number, actor: string): boolean {
  const s = w.settlements[id];
  if (!s || (s.status !== "failed" && s.status !== "on_hold")) return false;
  s.status = "scheduled";
  s.failureReason = undefined;
  s.updatedAt = at;
  w.seq += 1;
  w.audit = appendAudit(w.audit, { at, actor, action: "settlement.retry", target: id, details: {} }, w.seq);
  return true;
}

/**
 * Sends instructions to the lender and collects its answers. This is the ONLY thing the job does outside the
 * ledger, and it only calls `NbfcPort.submitSettlement`.
 */
export async function submitInstructions(instructions: SettlementInstruction[], nbfc: Pick<NbfcPort, "submitSettlement">): Promise<{ id: string; result: SettlementResult }[]> {
  const out: { id: string; result: SettlementResult }[] = [];
  for (const i of instructions) out.push({ id: i.settlementId, result: await nbfc.submitSettlement(i) });
  return out;
}
