/**
 * Refunds and disputes (basic): a vendor refunds one whole payment.
 *
 *  - Before the nightly settlement the payment is simply left out of it, so that night's total drops by that amount.
 *  - After it, the refund is a NEGATIVE ADJUSTMENT netted into the vendor's next batch (the lender has already been
 *    told about the original amount). Adjustments carry to later nights until a batch is big enough to absorb them.
 *  - The student stops owing the payment, with its fee and interest, and is told.
 *  - Caps: a vendor may raise a limited number per rolling 7 days, and a large refund waits for ops.
 *
 * Kredo moves no money here either: the lender nets the adjustment from the vendor's next payout.
 */
import { produce, type Draft } from "immer";
import { NOTE } from "../copy-demo";
import { getPolicy } from "../policy";
import { DAY } from "./time";
import type { Loan, Refund, WorldState } from "./types";
import { DomainError, audit, newId, notify } from "./world";

function applyRefund(d: Draft<WorldState>, refund: Draft<Refund>, at: number, actor: string): void {
  const loan = d.loans[refund.loanId];
  const mode = loan.settlementId ? "post_settlement" : "pre_settlement";
  loan.status = "refunded";
  loan.refundedCoins = loan.coins;
  loan.closedAt = at;
  if (mode === "pre_settlement") loan.vendorStatus = "refunded";
  else d.adjustments.push({ id: newId(d, "ADJ"), vendorId: loan.vendorId, coins: -loan.coins, reason: `Refund of ${loan.id}`, loanId: loan.id, createdAt: at });
  refund.status = "done";
  refund.mode = mode;
  refund.decidedAt = at;
  refund.decidedBy = actor;
  const account = d.students[loan.studentId]?.accountId;
  if (account) notify(d, account, at, "info", NOTE.refunded(d.vendors[loan.vendorId]?.stallName ?? "The stall", loan.coins), loan.id);
  audit(d, at, actor, "refund.done", refund.id, { loanId: loan.id, coins: loan.coins, mode });
}

export interface RefundInput {
  loanId: string;
  vendorId: string;
  reason: string;
  actor: string;
  at?: number;
}

/** A vendor refunds one payment in full. Idempotent per payment. A large one becomes a request for ops. */
export function refundPayment(world: WorldState, input: RefundInput): { world: WorldState; refund: Refund; duplicate: boolean } {
  const loan: Loan | undefined = world.loans[input.loanId];
  if (!loan || loan.vendorId !== input.vendorId) throw new DomainError("UNKNOWN_PAYMENT", "That payment is not one of this stall's.");
  const existing = world.refunds.find((r) => r.loanId === input.loanId && r.status !== "declined");
  if (existing) return { world, refund: existing, duplicate: true };
  if (loan.status === "refunded") throw new DomainError("ALREADY_REFUNDED", "That payment has already been refunded.");
  if (loan.repaid > 0) throw new DomainError("REPAYMENT_STARTED", "The student has already started repaying this payment, so it can't be refunded here. Contact support.");
  if (!input.reason.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason for the refund.");

  const p = getPolicy().refunds;
  const at = input.at ?? world.clock.now;
  const recent = world.refunds.filter((r) => r.vendorId === input.vendorId && r.status !== "declined" && r.requestedAt > at - 7 * DAY).length;
  if (recent >= p.maxPerVendorPer7Days) throw new DomainError("REFUND_CAP", `You can raise ${p.maxPerVendorPer7Days} refunds in 7 days. Contact support if you need more.`);

  let id = "";
  const next = produce(world, (d) => {
    id = newId(d, "RF");
    const refund: Refund = { id, loanId: loan.id, vendorId: loan.vendorId, studentId: loan.studentId, coins: loan.coins, reason: input.reason.trim(), requestedAt: at, status: "pending_ops" };
    d.refunds.push(refund);
    if (loan.coins > p.opsApprovalAboveCoins) audit(d, at, input.actor, "refund.requested", id, { loanId: loan.id, coins: loan.coins, reason: refund.reason });
    else applyRefund(d, d.refunds[d.refunds.length - 1], at, input.actor);
  });
  return { world: next, refund: next.refunds.find((r) => r.id === id)!, duplicate: false };
}

/** Ops decision on a refund waiting for approval. */
export function decideRefund(world: WorldState, refundId: string, approve: boolean, actor: string, reason?: string, at?: number): WorldState {
  const r = world.refunds.find((x) => x.id === refundId);
  if (!r) throw new DomainError("UNKNOWN_REFUND", "That refund does not exist.");
  if (r.status !== "pending_ops") throw new DomainError("NOT_PENDING", "That refund has already been decided.");
  if (!approve && !reason?.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason for declining.");
  const loan = world.loans[r.loanId];
  if (approve && (loan.repaid > 0 || loan.status === "refunded")) throw new DomainError("CHANGED", "The payment has changed since the request, so it can't be refunded now.");
  return produce(world, (d) => {
    const t = at ?? d.clock.now;
    const dr = d.refunds.find((x) => x.id === refundId)!;
    if (approve) applyRefund(d, dr, t, actor);
    else {
      dr.status = "declined";
      dr.decidedAt = t;
      dr.decidedBy = actor;
      dr.declineReason = reason!.trim();
      audit(d, t, actor, "refund.declined", refundId, { reason: dr.declineReason });
    }
  });
}
