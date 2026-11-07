/**
 * The live ledger strip ("what just happened"): the audit log and score events turned into plain-English lines, each
 * with its simulated-clock time. Read-only: it never changes the world, and it is rebuilt from the world every time,
 * so Reset clears it.
 */
import { displayedEffect } from "../aura/engine";
import { fmtDate, fmtDateTime } from "../domain/time";
import type { WorldState } from "../domain/types";

export type LedgerTone = "info" | "good" | "warn" | "bad";

export interface LedgerEvent {
  id: string;
  at: number;
  /** Creation order (the world's shared sequence), used to keep events that share a time in the order they happened. */
  ord: number;
  kind: "payment" | "loan" | "repayment" | "settlement" | "refund" | "flag" | "aura" | "vendor" | "clock" | "default";
  text: string;
  tone: LedgerTone;
  /** For the money-flow diagram. */
  flow?: "pay" | "settle" | "repay";
  amount?: number;
  vendorId?: string;
  studentId?: string;
}

const ordOf = (id: string) => Number(id.split("-").pop()) || 0;
const num = (x: unknown) => (typeof x === "number" ? x : 0);
const str = (x: unknown) => (typeof x === "string" ? x : "");

const FLAG_TEXT: Record<string, string> = {
  SELF_PAY: "tried to pay a stall linked to their own account. Blocked and flagged for review.",
  VELOCITY_STUDENT: "made too many payments in a short time. Blocked and flagged.",
  VELOCITY_VENDOR: "paid a stall that is receiving too many payments. Blocked and flagged.",
};

/** Events since the demo began, newest first. */
export function ledgerEvents(w: WorldState, opts: { since?: number; limit?: number } = {}): LedgerEvent[] {
  const since = opts.since ?? w.clock.startedAt;
  const first = (id: string) => w.students[id]?.firstName ?? "A student";
  const stall = (id: string) => w.vendors[id]?.stallName ?? "a stall";
  const out: LedgerEvent[] = [];

  for (const a of w.audit) {
    if (a.at < since) continue;
    const d = a.details;
    const ord = ordOf(a.id);
    switch (a.action) {
      case "payment.created": {
        const vendorId = str(d.vendorId);
        out.push({ id: `${a.id}-p`, at: a.at, ord: ord - 0.2, kind: "payment", tone: "info", flow: "pay", amount: num(d.coins), vendorId, studentId: a.actor, text: `${first(a.actor)} paid ${num(d.coins)} coins to ${stall(vendorId)}` });
        out.push({ id: `${a.id}-l`, at: a.at, ord: ord - 0.1, kind: "loan", tone: "info", text: `Coin spend created for ${first(a.actor)}, due ${fmtDate(str(d.due))}` });
        break;
      }
      case "repayment.recorded": {
        const loan = w.loans[str(d.loanId)];
        out.push({ id: a.id, at: a.at, ord, kind: "repayment", tone: "good", flow: "repay", amount: num(d.amount), studentId: a.actor, text: `${first(a.actor)} repaid ₹${num(d.amount)} to the lending partner${loan && d.full ? " (loan closed)" : " (part payment)"}` });
        break;
      }
      case "settlement.created":
        out.push({ id: a.id, at: a.at, ord, kind: "settlement", tone: "info", vendorId: str(d.vendorId), text: `Settlement scheduled for ${stall(str(d.vendorId))}: ₹${num(d.total)} across ${num(d.count)} payment${num(d.count) === 1 ? "" : "s"}` });
        break;
      case "settlement.paid": {
        const s = w.settlements[a.target];
        out.push({ id: a.id, at: a.at, ord, kind: "settlement", tone: "good", flow: "settle", amount: s?.totalAmount, vendorId: s?.vendorId, text: `Lending partner paid ${s ? stall(s.vendorId) : "the stall"} ₹${s?.totalAmount ?? 0}, ref ${str(d.reference)}` });
        break;
      }
      case "settlement.failed":
      case "settlement.on_hold": {
        const s = w.settlements[a.target];
        out.push({ id: a.id, at: a.at, ord, kind: "settlement", tone: "warn", vendorId: s?.vendorId, text: `Settlement for ${s ? stall(s.vendorId) : "a stall"} ${a.action === "settlement.failed" ? "did not complete" : "is on hold"}: ${str(d.reason)}` });
        break;
      }
      case "settlement.retry":
        out.push({ id: a.id, at: a.at, ord, kind: "settlement", tone: "info", text: `Settlement ${a.target} sent to the lending partner again` });
        break;
      case "refund.done": {
        const loan = w.loans[str(d.loanId)];
        out.push({ id: a.id, at: a.at, ord, kind: "refund", tone: "info", vendorId: loan?.vendorId, text: `${loan ? stall(loan.vendorId) : "A stall"} refunded ${num(d.coins)} coins to ${loan ? first(loan.studentId) : "a student"} (${d.mode === "post_settlement" ? "taken off the next payout" : "left out of tonight's settlement"})` });
        break;
      }
      case "refund.requested":
        out.push({ id: a.id, at: a.at, ord, kind: "refund", tone: "warn", text: `A refund of ${num(d.coins)} coins is waiting for ops approval` });
        break;
      case "fraud.flagged":
        out.push({ id: a.id, at: a.at, ord, kind: "flag", tone: "bad", studentId: str(d.studentId), vendorId: str(d.vendorId), text: `Fraud flag: ${first(str(d.studentId))} ${FLAG_TEXT[str(d.kind)] ?? "triggered a rule."}` });
        break;
      case "loan.defaulted":
        out.push({ id: a.id, at: a.at, ord, kind: "default", tone: "bad", studentId: str(d.studentId), text: `A coin spend of ${first(str(d.studentId))} passed 30 days overdue` });
        break;
      case "vendor.accepted":
        out.push({ id: a.id, at: a.at, ord, kind: "vendor", tone: "good", vendorId: a.target, text: `${stall(a.target)} was accepted and its QR is live` });
        break;
      case "vendor.submitted":
        out.push({ id: a.id, at: a.at, ord, kind: "vendor", tone: "info", vendorId: a.target, text: `${stall(a.target)} submitted for review` });
        break;
      case "vendor.rejected":
        out.push({ id: a.id, at: a.at, ord, kind: "vendor", tone: "warn", vendorId: a.target, text: `${stall(a.target)} was not accepted` });
        break;
      case "vendor.suspended":
        out.push({ id: a.id, at: a.at, ord, kind: "vendor", tone: "warn", vendorId: a.target, text: `${stall(a.target)} was suspended` });
        break;
      case "vendor.qr_regenerated":
        out.push({ id: a.id, at: a.at, ord, kind: "vendor", tone: "info", vendorId: a.target, text: `${stall(a.target)} made a new QR. The old one stopped working` });
        break;
      case "limit.approved":
        out.push({ id: a.id, at: a.at, ord, kind: "aura", tone: "good", text: `The lending partner approved a higher limit for ${first(a.target)}` });
        break;
    }
  }

  for (const e of w.scoreEvents) {
    if (e.at < since || e.delta === 0 || e.at > w.clock.now) continue;
    const eff = displayedEffect(e, w.clock.now).shown;
    out.push({ id: e.id, at: e.at, ord: ordOf(e.id), kind: "aura", tone: eff > 0 ? "good" : "warn", studentId: e.studentId, text: `${first(e.studentId)}'s Aura ${eff > 0 ? "+" : ""}${eff}: ${e.explanation}` });
  }

  for (const [i, h] of w.clock.history.entries()) out.push({ id: `clock-${i}`, at: h.at, ord: Number.MAX_SAFE_INTEGER - 1e6 + i, kind: "clock", tone: "info", text: `Clock moved: ${h.label} (${fmtDateTime(h.at)})` });

  const sorted = out.sort((a, b) => b.at - a.at || b.ord - a.ord);
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}
