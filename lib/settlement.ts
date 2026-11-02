/**
 * The midnight settlement job (docs/MVP_DEMO_PROMPT.md, B9).
 *
 * At each cut-off Kredo totals what every vendor received since the last one and produces a SETTLEMENT INSTRUCTION:
 * a report the lending partner (NBFC) acts on. THIS MODULE NEVER MOVES MONEY. The lender pays the vendor; Kredo only
 * records and reports. The one outward call is `NbfcPort.submitSettlement` (lib/api/nbfc-port.ts), and a unit test
 * asserts that boundary.
 *
 * The job is idempotent: a settlement id is `vendor + business date`, so running a cut-off twice creates nothing new.
 */
import type { NbfcPort, SettlementInstruction, SettlementResult } from "./api/nbfc-port";
import { NOTE } from "./copy-demo";
import { appendAudit } from "./domain/audit";
import { batchDate } from "./domain/time";
import type { Settlement, WorldState } from "./domain/types";

export const settlementId = (vendorId: string, date: string) => `SET-${vendorId}-${date.replaceAll("-", "")}`;

/**
 * Builds the settlement for every vendor with unsettled payments received before `cutoff`. Mutates the given
 * (draft) world. Returns the ids of the settlements it created; ids that already existed are left alone.
 *
 *  - Refunds before settlement are netted (a refunded payment is never reported as owed).
 *  - A refund after settlement is a negative adjustment, netted into the next batch.
 *  - Adjustments only apply while the batch stays at or above zero; the rest carry to the next night.
 */
export function buildSettlements(w: WorldState, cutoff: number): string[] {
  const date = batchDate(cutoff);
  const byVendor = new Map<string, string[]>();
  for (const l of Object.values(w.loans)) {
    if (l.vendorStatus !== "received" || l.settlementId || l.createdAt >= cutoff) continue;
    byVendor.set(l.vendorId, [...(byVendor.get(l.vendorId) ?? []), l.id]);
  }

  const created: string[] = [];
  for (const [vendorId, loanIds] of [...byVendor.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const id = settlementId(vendorId, date);
    if (w.settlements[id]) continue; // idempotent
    const loans = loanIds.map((x) => w.loans[x]).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const gross = loans.reduce((s, l) => s + l.coins, 0);
    const refunds = loans.reduce((s, l) => s + l.refundedCoins, 0);
    let net = gross - refunds;

    const adjustmentIds: string[] = [];
    let adjustmentCoins = 0;
    for (const a of w.adjustments.filter((x) => x.vendorId === vendorId && !x.settlementId && x.createdAt < cutoff).sort((x, y) => x.createdAt - y.createdAt)) {
      if (net + a.coins < 0) break;
      net += a.coins;
      adjustmentCoins += a.coins;
      adjustmentIds.push(a.id);
    }
    if (loans.length === 0) continue;

    const settlement: Settlement = {
      id, vendorId, date, grossCoins: gross, refundCoins: refunds, adjustmentCoins, totalAmount: net,
      count: loans.length, loanIds: loans.map((l) => l.id), adjustmentIds, bankMasked: w.vendors[vendorId]?.bankMasked ?? "",
      status: "scheduled", createdAt: cutoff, updatedAt: cutoff,
    };
    w.settlements[id] = settlement;
    for (const l of loans) l.settlementId = id;
    for (const a of w.adjustments) if (adjustmentIds.includes(a.id)) a.settlementId = id;
    w.seq += 1;
    w.audit = appendAudit(w.audit, { at: cutoff, actor: "system", action: "settlement.created", target: id, details: { vendorId, date, total: net, count: loans.length } }, w.seq);
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
