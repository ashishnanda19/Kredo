"use client";

/**
 * Student actions on the world: checking and submitting a payment, and repaying. The "server" is the pure domain code;
 * these functions apply its answer to the store.
 *
 * Idempotent retry demo: when the presenter arms "fail next pay", the payment IS recorded but the answer is lost
 * (a NetworkError), like a dropped connection after the server did the work. Retrying with the same key returns the
 * same loan, so exactly one loan exists.
 */
import { getAdapters } from "../api";
import { AURA_W } from "../copy-demo";
import { precheckPay, payByQr, type PayCode, type PayInput, type PrecheckResult } from "../domain/pay";
import { amountDue } from "../domain/selectors";
import type { Loan, ScoreEvent } from "../domain/types";
import { DomainError, awardQuest, repayLoan } from "../domain/world";
import { useWorld } from "./world";

export class NetworkError extends Error {
  constructor() {
    super("The connection dropped before we heard back.");
    this.name = "NetworkError";
  }
}

/** Gate checks only. Leaves a fraud flag for abuse-looking blocks. */
export function precheck(input: Pick<PayInput, "studentId" | "qr" | "coins" | "microSpend">): PrecheckResult {
  const s = useWorld.getState();
  const r = precheckPay(s.world, input);
  if (r.world !== s.world) s.apply(() => r.world);
  return r;
}

export type SubmitResult = { ok: true; loan: Loan; duplicate: boolean } | { ok: false; code: PayCode; message: string };

export async function submitPay(input: PayInput): Promise<SubmitResult> {
  const s = useWorld.getState();
  const r = payByQr(s.world, input);
  if (r.world !== s.world) s.apply(() => r.world);
  if (!r.ok) return r;
  if (!r.duplicate && useWorld.getState().scenarios.failNextPay) {
    useWorld.getState().setScenario("failNextPay", false);
    throw new NetworkError();
  }
  return { ok: true, loan: r.loan, duplicate: r.duplicate };
}

export interface RepayOutcome {
  paid: number;
  loans: string[];
  events: ScoreEvent[];
}

/** Repays the given loans in due-date order. `amount` is only for one loan (a partial or full payment of it). */
export function repay(loanIds: string[], key: string, amount?: number): RepayOutcome {
  const s = useWorld.getState();
  let w = s.world;
  const ordered = loanIds.map((id) => w.loans[id]).filter(Boolean).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  if (!ordered.length) throw new DomainError("UNKNOWN_LOAN", "That coin spend does not exist.");
  if (amount !== undefined && ordered.length !== 1) throw new DomainError("BAD_AMOUNT", "A part payment is for one coin spend at a time.");
  const events: ScoreEvent[] = [];
  let paid = 0;
  for (const l of ordered) {
    const due = amountDue(w.loans[l.id]);
    if (due <= 0) continue;
    const r = repayLoan(w, { loanId: l.id, amount: amount ?? due, idempotencyKey: `${key}:${l.id}` });
    w = r.world;
    if (!r.duplicate) events.push(...r.events);
    paid += r.repayment.amount;
  }
  s.apply(() => w);
  return { paid, loans: ordered.map((l) => l.id), events };
}

export type QuestOutcome = { ok: true; delta: number } | { ok: false; message: string };

/**
 * A student does one of the three tapped quests. Identity and bank quests first ask the (mock) verification provider;
 * the engine then applies the caps. A quest that would add nothing is refused and stays available.
 */
export async function completeQuest(studentId: string, questId: "verify_identity" | "verify_bank" | "set_reminders"): Promise<QuestOutcome> {
  const s = useWorld.getState();
  const student = s.world.students[studentId];
  if (!student) return { ok: false, message: AURA_W.questReject.NOT_AVAILABLE };
  if (questId === "verify_identity") {
    const r = await getAdapters().verification.submitKyc({ kind: "student", idMasked: student.idMasked });
    if (r.outcome !== "verified") return { ok: false, message: AURA_W.questVerifyFail };
  }
  if (questId === "verify_bank") {
    const r = await getAdapters().verification.pennyDrop({ bankMasked: "•••• 0000", ifsc: "DEMO0000001", ownerName: student.firstName, stallName: student.firstName });
    if (r.outcome !== "success") return { ok: false, message: AURA_W.questVerifyFail };
  }
  const r = awardQuest(useWorld.getState().world, studentId, questId);
  if (!r.result.draft) return { ok: false, message: AURA_W.questReject[r.result.rejected ?? "NOT_AVAILABLE"] };
  useWorld.getState().apply(() => r.world);
  return { ok: true, delta: r.result.draft.delta };
}
