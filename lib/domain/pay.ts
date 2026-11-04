/**
 * Paying a stall by QR: the gate checks, the quote shown before consent, and the idempotent submit.
 *
 * The gates run in a fixed order, each with a reason code and a plain message (docs/MVP_DEMO_PROMPT.md, B7):
 *   student verified; not blocked; Aura at or above the threshold; no loan past grace; amount within the available
 *   limit; amount within the post-default cap; stall active and under its daily cap; not a self-pay; velocity limits.
 *
 * No money moves here. A payment records a loan for the student and a receivable for the stall; the lender pays the stall.
 */
import { postDefaultCap } from "../aura/engine";
import { PAYGATE } from "../copy-demo";
import { checkQr } from "../qr";
import { getPolicy, totalRepayable } from "../policy";
import { amountDue, availableLimit, pastGraceLoans, receivedOn, studentState } from "./selectors";
import { DAY, HOUR, addDays, istDate } from "./time";
import { raiseFlag } from "./flags";
import type { FraudFlagKind, Loan, WorldState } from "./types";
import { isVendorActive } from "./vendors";
import { IdempotencyConflict, createLoan } from "./world";
import { produce } from "immer";

export type PayCode =
  | "BAD_AMOUNT" | "STUDENT_NOT_VERIFIED" | "ACCOUNT_BLOCKED" | "LOW_AURA" | "PAST_DUE" | "OVER_LIMIT" | "PRIOR_DEFAULT_CAP"
  | "MICRO_NOT_AVAILABLE" | "VENDOR_NOT_ACTIVE" | "VENDOR_DAILY_CAP" | "SELF_PAY" | "VELOCITY_STUDENT" | "VELOCITY_VENDOR"
  | "MALFORMED" | "BAD_SIGNATURE" | "UNKNOWN_STALL" | "REVOKED" | "INACTIVE";

export type GateResult = { ok: true } | { ok: false; code: PayCode; message: string };
const no = (code: PayCode, message: string): GateResult => ({ ok: false, code, message });

/** Whether this student and stall are the same person, by device, phone or ID. Returns what matched. */
export function selfPayLink(w: WorldState, studentId: string, vendorId: string): "device" | "phone" | "id" | null {
  const s = w.students[studentId];
  const v = w.vendors[vendorId];
  if (!s || !v) return null;
  const sa = w.accounts[s.accountId];
  const va = w.accounts[v.accountId];
  if (sa?.deviceLinkId && sa.deviceLinkId === va?.deviceLinkId) return "device";
  if (sa?.phoneMasked && sa.phoneMasked === va?.phoneMasked) return "phone";
  if (s.idMasked && v.onboarding?.idMasked && s.idMasked === v.onboarding.idMasked) return "id";
  return null;
}

/**
 * The small "proof of repayment" payment: open to someone recovering (a prior default, or Aura below the minimum) who
 * has not done it yet, if the policy allows it. It is the one spend a low Aura may make, so repaying it on time can
 * earn Aura back.
 */
export function microSpendEligible(w: WorldState, studentId: string, at: number = w.clock.now): boolean {
  const p = getPolicy();
  if (!p.quests.microSpend.enabled) return false;
  const s = studentState(w, studentId, at);
  return !s.microSpendDone && (s.hasPriorDefault || s.aura < p.aura.blockBelowAura);
}

/** The money-free checks on one request, in the documented order. Does not change anything. */
export function checkGate(w: WorldState, studentId: string, vendorId: string, coins: number, at: number = w.clock.now, opts: { microSpend?: boolean } = {}): GateResult {
  const p = getPolicy();
  const student = w.students[studentId];
  const vendor = w.vendors[vendorId];
  if (!Number.isInteger(coins) || coins <= 0) return no("BAD_AMOUNT", PAYGATE.BAD_AMOUNT());
  if (!student || student.verification !== "accepted") return no("STUDENT_NOT_VERIFIED", PAYGATE.STUDENT_NOT_VERIFIED());
  if (w.accounts[student.accountId]?.status === "suspended") return no("ACCOUNT_BLOCKED", PAYGATE.ACCOUNT_BLOCKED());

  const state = studentState(w, studentId, at);
  if (opts.microSpend && (coins !== p.quests.microSpend.coins || !microSpendEligible(w, studentId, at))) return no("MICRO_NOT_AVAILABLE", PAYGATE.MICRO_NOT_AVAILABLE());
  if (state.aura < p.aura.blockBelowAura && !opts.microSpend) return no("LOW_AURA", PAYGATE.LOW_AURA());
  const past = pastGraceLoans(w, studentId, at);
  if (past.length) return no("PAST_DUE", PAYGATE.PAST_DUE(past.reduce((s, l) => s + amountDue(l), 0)));

  const avail = availableLimit(w, studentId, at);
  if (coins > avail) return no("OVER_LIMIT", PAYGATE.OVER_LIMIT(avail, coins));
  const cap = postDefaultCap(state);
  if (cap !== null && coins > cap) return no("PRIOR_DEFAULT_CAP", PAYGATE.PRIOR_DEFAULT_CAP(cap));

  if (!vendor || !isVendorActive(vendor)) return no("VENDOR_NOT_ACTIVE", PAYGATE.VENDOR_NOT_ACTIVE());
  if (receivedOn(w, vendorId, istDate(at)).coins + coins > vendor.dailyCap) return no("VENDOR_DAILY_CAP", PAYGATE.VENDOR_DAILY_CAP());
  if (selfPayLink(w, studentId, vendorId)) return no("SELF_PAY", PAYGATE.SELF_PAY());

  const v = p.velocity;
  const recent = (since: number, filter: (l: Loan) => boolean) => Object.values(w.loans).filter((l) => filter(l) && l.createdAt > since && l.createdAt <= at);
  const sHour = recent(at - HOUR, (l) => l.studentId === studentId);
  const sDay = recent(at - DAY, (l) => l.studentId === studentId);
  const sum = (ls: Loan[]) => ls.reduce((a, l) => a + l.coins, 0);
  if (sHour.length + 1 > v.student.perHour.count || sum(sHour) + coins > v.student.perHour.coins) return no("VELOCITY_STUDENT", PAYGATE.VELOCITY_STUDENT());
  if (sDay.length + 1 > v.student.perDay.count || sum(sDay) + coins > v.student.perDay.coins) return no("VELOCITY_STUDENT", PAYGATE.VELOCITY_STUDENT());
  const vHour = recent(at - HOUR, (l) => l.vendorId === vendorId);
  if (vHour.length + 1 > v.vendor.perHour.count || sum(vHour) + coins > v.vendor.perHour.coins) return no("VELOCITY_VENDOR", PAYGATE.VELOCITY_VENDOR());
  return { ok: true };
}

export interface Quote {
  coins: number;
  fee: number;
  interest: number;
  total: number;
  termDays: number;
  dueDate: string;
  /** Available limit left once this payment is made. */
  limitAfter: number;
}

/** Everything the confirm sheet shows BEFORE the student consents. */
export function quote(w: WorldState, studentId: string, coins: number, termDays: number = getPolicy().repayment.dueInDaysDefault, at: number = w.clock.now): Quote {
  const t = totalRepayable(coins, termDays);
  return { coins, fee: t.fee, interest: t.interest, total: t.total, termDays, dueDate: addDays(istDate(at), termDays), limitAfter: Math.max(0, availableLimit(w, studentId, at) - coins) };
}

/** The repayment windows a student may choose between, from policy. */
export function termOptions(): number[] {
  const r = getPolicy().repayment;
  return [...new Set([r.dueInDaysMin, r.dueInDaysDefault, r.dueInDaysMax])].sort((a, b) => a - b);
}

export interface PayInput {
  studentId: string;
  /** What the QR said. */
  qr: string;
  coins: number;
  termDays?: number;
  /** The proof-of-repayment payment: fixed amount and window from policy. */
  microSpend?: boolean;
  idempotencyKey: string;
  at?: number;
}

export type PayResult =
  | { ok: true; world: WorldState; loan: Loan; duplicate: boolean }
  | { ok: false; world: WorldState; code: PayCode; message: string };

function flag(w: WorldState, kind: FraudFlagKind, studentId: string, vendorId: string, detail: string, at: number): WorldState {
  return produce(w, (d) => void raiseFlag(d, kind, studentId, vendorId, detail, at));
}

export type PrecheckResult = { ok: true; world: WorldState; vendorId: string } | { ok: false; world: WorldState; code: PayCode; message: string };

/**
 * Scan and gate checks for one request, without creating anything. A blocked attempt that looks like abuse leaves a
 * fraud flag (the returned world carries it), so the flag exists even when the student never gets as far as paying.
 */
export function precheckPay(world: WorldState, input: Pick<PayInput, "studentId" | "qr" | "coins" | "at" | "microSpend">): PrecheckResult {
  const at = input.at ?? world.clock.now;
  const scan = checkQr(world, input.qr);
  if (!scan.ok) return { ok: false, world, code: scan.code, message: PAYGATE[scan.code]() };
  const gate = checkGate(world, input.studentId, scan.vendorId, input.coins, at, { microSpend: input.microSpend });
  if (gate.ok) return { ok: true, world, vendorId: scan.vendorId };
  let w = world;
  if (gate.code === "SELF_PAY") w = flag(w, "SELF_PAY", input.studentId, scan.vendorId, `Blocked: the student and the stall share a ${selfPayLink(world, input.studentId, scan.vendorId)}.`, at);
  if (gate.code === "VELOCITY_STUDENT") w = flag(w, "VELOCITY_STUDENT", input.studentId, scan.vendorId, "Too many payments in a short time.", at);
  if (gate.code === "VELOCITY_VENDOR") w = flag(w, "VELOCITY_VENDOR", input.studentId, scan.vendorId, "The stall received too many payments in an hour.", at);
  return { ok: false, world: w, code: gate.code, message: gate.message };
}

/**
 * The server side of a payment. Idempotent: a repeated key returns the same loan even if the limit has since been
 * used up, and the same key with a different request is refused.
 */
export function payByQr(world: WorldState, input: PayInput): PayResult {
  const at = input.at ?? world.clock.now;
  const term = input.microSpend ? getPolicy().quests.microSpend.dueInDays : (input.termDays ?? getPolicy().repayment.dueInDaysDefault);

  const prior = Object.values(world.loans).find((l) => l.idempotencyKey === input.idempotencyKey);
  if (prior) {
    const same = prior.studentId === input.studentId && prior.coins === input.coins && prior.termDays === term && !!prior.microSpend === !!input.microSpend;
    if (!same) throw new IdempotencyConflict(input.idempotencyKey);
    return { ok: true, world, loan: prior, duplicate: true };
  }

  const pre = precheckPay(world, { studentId: input.studentId, qr: input.qr, coins: input.coins, at, microSpend: input.microSpend });
  if (!pre.ok) return pre;
  const r = createLoan(world, { studentId: input.studentId, vendorId: pre.vendorId, coins: input.coins, termDays: term, microSpend: input.microSpend, idempotencyKey: input.idempotencyKey, at });
  return { ok: true, world: r.world, loan: r.loan, duplicate: r.duplicate };
}
