/**
 * The demo world: pure reducers over `WorldState` (immer). Every function takes a world and returns a new one; none
 * reads the real clock, randomness or the network. The simulated clock only moves through `advanceTo`.
 *
 * MONEY BOUNDARY: these reducers RECORD loans, repayments, scores and settlement instructions. They never move,
 * hold or pool money. A "payment" here is a loan created for a student and a receivable recorded for a vendor.
 *
 * Idempotent where it matters: `createLoan` and `repayLoan` return the existing record for a repeated key, so a
 * double tap never double-books, and the same key with a different body is a conflict, not a second loan.
 */
import { produce, type Draft } from "immer";
import {
  QUEST_KIND, defaultClearedDraft, defaultDraft, deriveState, highUtilDraft, questAward, repaymentDrafts, type EventDraft, type QuestResult, type StudentState,
} from "../aura/engine";
import { NOTE } from "../copy-demo";
import { getPolicy, computeFee, computeInterest, type Policy, type QuestId } from "../policy";
import { buildSettlements } from "../settlement";
import { appendAudit } from "./audit";
import { runFraudRules } from "./flags";
import { amountDue, hasOverdue, isOpen, loansOfStudent, principalOutstanding } from "./selectors";
import { DAY, HOUR, addDays, daysBetween, daysPastDue, istDate, istStartOf, nextCutoff } from "./time";
import type { Loan, Notification, Repayment, ScoreEvent, WorldState } from "./types";

export const WORLD_SCHEMA = 4;

export class DomainError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? code);
    this.name = "DomainError";
  }
}

/** The same idempotency key was used for a different request. Never silently treated as the first one. */
export class IdempotencyConflict extends DomainError {
  constructor(key: string) {
    super("IDEMPOTENCY_CONFLICT", `Idempotency key "${key}" was already used for a different request`);
    this.name = "IdempotencyConflict";
  }
}

export function emptyWorld(seed: number, startedAt: number): WorldState {
  return {
    schema: WORLD_SCHEMA, seed, clock: { now: startedAt, startedAt, history: [] }, accounts: {}, students: {}, vendors: {}, loans: {}, repayments: [], adjustments: [],
    settlements: {}, scoreEvents: [], notifications: [], audit: [], flags: [], monitoring: false, refunds: [], lastCutoff: istStartOf(istDate(startedAt)), seq: 0,
  };
}

// draft helpers ---------------------------------------------------------------------------------------------------

const nextSeq = (d: Draft<WorldState>) => ++d.seq;
export const newId = (d: Draft<WorldState>, prefix: string) => `${prefix}-${String(nextSeq(d)).padStart(5, "0")}`;

export function audit(d: Draft<WorldState>, at: number, actor: string, action: string, target: string, details: Record<string, string | number | boolean> = {}) {
  d.audit = appendAudit(d.audit, { at, actor, action, target, details }, nextSeq(d));
}

function pushEvents(d: Draft<WorldState>, studentId: string, at: number, drafts: EventDraft[]): ScoreEvent[] {
  const out: ScoreEvent[] = [];
  for (const draft of drafts) {
    const e: ScoreEvent = { id: newId(d, "E"), studentId, at, ...draft };
    d.scoreEvents.push(e);
    out.push(e);
  }
  return out;
}

export function notify(d: Draft<WorldState>, accountId: string, at: number, kind: Notification["kind"], text: { title: string; body: string }, loanId?: string) {
  d.notifications.push({ id: newId(d, "N"), at, accountId, kind, title: text.title, body: text.body, loanId });
}

const eventsOf = (d: Draft<WorldState> | WorldState, studentId: string): ScoreEvent[] => d.scoreEvents.filter((e) => e.studentId === studentId);

/** Tell the student when their limit moved, in plain language. */
function limitNotice(d: Draft<WorldState>, studentId: string, before: StudentState, after: StudentState, at: number) {
  const account = d.students[studentId]?.accountId;
  if (!account) return;
  if (after.level > before.level) notify(d, account, at, "limit_up", NOTE.limitUp(after.limit));
  else if (after.level < before.level) notify(d, account, at, "limit_down", NOTE.limitDown(after.limit));
  if (after.pendingIncreaseToLevel && after.pendingIncreaseToLevel !== before.pendingIncreaseToLevel) {
    notify(d, account, at, "info", NOTE.limitPending(getPolicy().ladder.levels[after.pendingIncreaseToLevel - 1].limit));
  }
}

// loans -----------------------------------------------------------------------------------------------------------

export interface LoanDraft {
  studentId: string;
  vendorId: string;
  /** Principal in coins (= ₹). */
  coins: number;
  idempotencyKey: string;
  at?: number;
  termDays?: number;
  microSpend?: boolean;
}

export interface CreateLoanResult {
  world: WorldState;
  loan: Loan;
  /** True when the key was already used for this same request: nothing was created. */
  duplicate: boolean;
}

/**
 * Records one spend as a loan for the student and a receivable for the vendor. This is the bare ledger step: the pay
 * flow (Milestone 3) runs every gate check BEFORE calling it. Idempotent on `idempotencyKey`.
 */
export function createLoan(world: WorldState, draft: LoanDraft): CreateLoanResult {
  const p = getPolicy();
  if (!Number.isInteger(draft.coins) || draft.coins <= 0) throw new DomainError("BAD_AMOUNT", "An amount must be a whole number of coins above zero.");
  if (!world.students[draft.studentId] || !world.vendors[draft.vendorId]) throw new DomainError("UNKNOWN_PARTY", "That student or stall does not exist.");
  const term = draft.termDays ?? (draft.microSpend ? p.quests.microSpend.dueInDays : p.repayment.dueInDaysDefault);
  if (!draft.microSpend && (term < p.repayment.dueInDaysMin || term > p.repayment.dueInDaysMax)) throw new DomainError("BAD_TERM", `The repayment window must be ${p.repayment.dueInDaysMin} to ${p.repayment.dueInDaysMax} days.`);

  const bodyKey = [draft.studentId, draft.vendorId, draft.coins, term, draft.microSpend ? "micro" : ""].join("|");
  const existing = Object.values(world.loans).find((l) => l.idempotencyKey === draft.idempotencyKey);
  if (existing) {
    if (existing.bodyKey !== bodyKey) throw new IdempotencyConflict(draft.idempotencyKey);
    return { world, loan: existing, duplicate: true };
  }

  let loanId = "";
  const next = produce(world, (d) => {
    const at = draft.at ?? d.clock.now;
    loanId = newId(d, "L");
    const fee = computeFee(draft.coins, p);
    const interest = computeInterest(draft.coins, term, p);
    d.loans[loanId] = {
      id: loanId, studentId: draft.studentId, vendorId: draft.vendorId, coins: draft.coins, fee, interest, totalRepayable: draft.coins + fee + interest,
      dueDate: addDays(istDate(at), term), termDays: term, status: "active", vendorStatus: "received", idempotencyKey: draft.idempotencyKey, bodyKey,
      createdAt: at, repaid: 0, refundedCoins: 0, ...(draft.microSpend ? { microSpend: true } : {}),
    };
    audit(d, at, draft.studentId, "payment.created", loanId, { vendorId: draft.vendorId, coins: draft.coins, due: d.loans[loanId].dueDate });
  });
  return { world: next, loan: next.loans[loanId], duplicate: false };
}

export interface RepayInput {
  loanId: string;
  /** Rupees. A partial amount is allowed. */
  amount: number;
  at?: number;
  idempotencyKey?: string;
}

export interface RepayResult {
  world: WorldState;
  repayment: Repayment;
  duplicate: boolean;
  /** The score events this repayment produced. */
  events: ScoreEvent[];
}

/** Applies a repayment: fees and interest first, then principal. Writes the score events with their reasons. */
export function repayLoan(world: WorldState, input: RepayInput): RepayResult {
  const loan = world.loans[input.loanId];
  if (!loan) throw new DomainError("UNKNOWN_LOAN", "That coin spend does not exist.");
  if (input.idempotencyKey) {
    const dup = world.repayments.find((r) => r.idempotencyKey === input.idempotencyKey);
    if (dup) {
      if (dup.loanId !== input.loanId || dup.amount !== input.amount) throw new IdempotencyConflict(input.idempotencyKey);
      return { world, repayment: dup, duplicate: true, events: [] };
    }
  }
  if (loan.status === "paid" || loan.status === "refunded") throw new DomainError("ALREADY_CLOSED", "That coin spend is already closed.");
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new DomainError("BAD_AMOUNT", "A repayment must be a whole number of rupees above zero.");
  const due = amountDue(loan);
  if (input.amount > due) throw new DomainError("OVERPAYMENT", `That is more than the ${due} still owed.`);

  const at = input.at ?? world.clock.now;
  const before = deriveState(eventsOf(world, loan.studentId), at);
  const full = input.amount === due;
  const loanEvents = world.scoreEvents.filter((e) => e.loanId === loan.id);
  let repaymentId = "";
  let produced: ScoreEvent[] = [];

  const next = produce(world, (d) => {
    const l = d.loans[loan.id];
    repaymentId = newId(d, "R");
    const cum = l.repaid + input.amount;
    const feeApplied = Math.min(l.fee, cum) - Math.min(l.fee, l.repaid);
    const interestApplied = Math.min(l.interest, Math.max(0, cum - l.fee)) - Math.min(l.interest, Math.max(0, l.repaid - l.fee));
    const principalApplied = input.amount - feeApplied - interestApplied;
    l.repaid = cum;
    d.repayments.push({
      id: repaymentId, loanId: l.id, studentId: l.studentId, amount: input.amount, at, kind: full ? "full" : "partial",
      applied: { fee: feeApplied, interest: interestApplied, principal: principalApplied }, ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    });
    if (full) {
      l.status = "paid";
      l.closedAt = at;
    }

    const drafts = repaymentDrafts({ state: before, loan: { id: l.id, dueDate: l.dueDate, defaultedAt: l.defaultedAt }, at, full, loanEvents }, getPolicy());
    produced = pushEvents(d, l.studentId, at, drafts);

    // a defaulted amount fully cleared starts the recovery period
    if (full && l.defaultedAt !== undefined && !Object.values(d.loans).some((x) => x.studentId === l.studentId && x.status === "defaulted")) {
      produced = [...produced, ...pushEvents(d, l.studentId, at, [defaultClearedDraft(l.id)])];
    }
    // streak and micro-spend quests are behaviours, awarded automatically when the repayment earns them
    const awards: QuestId[] = [];
    if (produced.some((e) => e.kind === "ON_TIME" && e.scored)) awards.push("streak_3");
    if (full && l.microSpend && daysPastDue(l.dueDate, at) === 0) awards.push("micro_spend");
    for (const q of awards) {
      const r = questAward(eventsOf(d, l.studentId), q, at, { hasOverdue: hasOverdue(d as WorldState, l.studentId, at) });
      if (r.draft) produced = [...produced, ...pushEvents(d, l.studentId, at, [r.draft])];
    }
    limitNotice(d, l.studentId, before, deriveState(eventsOf(d, l.studentId), at), at);
    audit(d, at, l.studentId, "repayment.recorded", repaymentId, { loanId: l.id, amount: input.amount, full });
  });
  return { world: next, repayment: next.repayments.find((r) => r.id === repaymentId)!, duplicate: false, events: produced };
}

// quests and limit approval ----------------------------------------------------------------------------------------

/** A student completes a risk-reducing quest. Capped; a quest that would add nothing is rejected and not used up. */
export function awardQuest(world: WorldState, studentId: string, questId: QuestId, at: number = world.clock.now): { world: WorldState; result: QuestResult } {
  if (!world.students[studentId]) throw new DomainError("UNKNOWN_PARTY");
  const result = questAward(eventsOf(world, studentId), questId, at, { hasOverdue: hasOverdue(world, studentId, at) });
  if (!result.draft) return { world, result };
  const before = deriveState(eventsOf(world, studentId), at);
  const next = produce(world, (d) => {
    pushEvents(d, studentId, at, [result.draft!]);
    audit(d, at, studentId, "quest.completed", QUEST_KIND[questId], { delta: result.draft!.delta });
    limitNotice(d, studentId, before, deriveState(eventsOf(d, studentId), at), at);
  });
  return { world: next, result };
}

/** The lender approves a waiting limit increase (only used when the policy requires approval). */
export function approveIncrease(world: WorldState, studentId: string, actor: string, at: number = world.clock.now): WorldState {
  const s = deriveState(eventsOf(world, studentId), at);
  if (!s.pendingIncreaseToLevel) return world;
  const to = s.pendingIncreaseToLevel;
  return produce(world, (d) => {
    pushEvents(d, studentId, at, [{ kind: "LIMIT_APPROVED", delta: 0, reasonCode: "LIMIT_APPROVED", explanation: `The lending partner approved a higher limit.`, meta: { toLevel: to } }]);
    audit(d, at, actor, "limit.approved", studentId, { toLevel: to });
    limitNotice(d, studentId, s, deriveState(eventsOf(d, studentId), at), at);
  });
}

/**
 * Ops sets a student's limit step by hand. A reason is required and an audit entry is written; the student is told.
 * It changes the step only: the Aura score, streak and default memory are untouched, and nothing money-related moves.
 */
export function overrideLimit(world: WorldState, studentId: string, toLevel: number, actor: string, reason: string, at: number = world.clock.now): WorldState {
  const p = getPolicy();
  if (!world.students[studentId]) throw new DomainError("UNKNOWN_PARTY", "That student does not exist.");
  if (!Number.isInteger(toLevel) || toLevel < 1 || toLevel > p.ladder.levels.length) throw new DomainError("BAD_LEVEL", `Choose a step from 1 to ${p.ladder.levels.length}.`);
  if (!reason.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason. It is written to the audit log.");
  const before = deriveState(eventsOf(world, studentId), at);
  if (before.level === toLevel) throw new DomainError("NO_CHANGE", "That is already the student's step.");
  return produce(world, (d) => {
    pushEvents(d, studentId, at, [{ kind: "LIMIT_OVERRIDE", delta: 0, reasonCode: "LIMIT_OVERRIDE", explanation: "The limit was set by the lending partner's operations team.", meta: { toLevel } }]);
    audit(d, at, actor, "limit.override", studentId, { fromLevel: before.level, toLevel, reason: reason.trim() });
    limitNotice(d, studentId, before, deriveState(eventsOf(d, studentId), at), at);
  });
}

// the simulated clock ---------------------------------------------------------------------------------------------

/** The next scheduled instant: midnight, the reminder hour, or the moment a payment's settlement falls due. */
function nextBoundary(w: WorldState, t: number, p: Policy): number {
  let next = Math.min(nextCutoff(t, 0), nextCutoff(t, p.reminders.atHourIst));
  for (const l of Object.values(w.loans)) {
    if (l.vendorStatus !== "received" || l.settlementId) continue;
    const due = l.createdAt + p.settlement.delayHours * HOUR;
    if (due > t && due < next) next = due;
  }
  return next;
}

/** Utilisation at the due time: a penalty at most once per due date and once per cool-down window. */
function checkUtilisation(d: Draft<WorldState>, t: number, dueDate: string, p: Policy) {
  const students = new Set(Object.values(d.loans).filter((l) => l.dueDate === dueDate && l.status !== "refunded").map((l) => l.studentId));
  for (const sid of [...students].sort()) {
    const events = eventsOf(d, sid);
    const state = deriveState(events, t, p);
    const util = state.limit ? (loansOfStudent(d as WorldState, sid).reduce((s, l) => s + principalOutstanding(l), 0) / state.limit) * 100 : 0;
    const recent = events.some((e) => e.kind === "HIGH_UTIL" && e.at > t - p.aura.rewardCooldownDays * DAY);
    if (util > p.aura.highUtilisationPercent && !recent) {
      const loan = loansOfStudent(d as WorldState, sid).find((l) => l.dueDate === dueDate)!;
      pushEvents(d, sid, t, [highUtilDraft(loan.id, util, p)]);
    }
  }
}

/** Marks loans overdue after the grace day and defaulted after 30 days, with the score events and notices. */
function applyTransitions(d: Draft<WorldState>, t: number, p: Policy) {
  for (const l of Object.values(d.loans).sort((a, b) => a.id.localeCompare(b.id))) {
    if (!isOpen(l)) continue;
    const dpd = daysPastDue(l.dueDate, t);
    const account = d.students[l.studentId]?.accountId;
    if (dpd > p.repayment.defaultAfterDays && l.status !== "defaulted") {
      const before = deriveState(eventsOf(d, l.studentId), t, p);
      const owed = principalOutstanding(l);
      l.status = "defaulted";
      l.defaultedAt = t;
      pushEvents(d, l.studentId, t, [defaultDraft(l.id, owed, dpd, p)]);
      if (account) notify(d, account, t, "default", NOTE.defaulted(amountDue(l)), l.id);
      limitNotice(d, l.studentId, before, deriveState(eventsOf(d, l.studentId), t, p), t);
      audit(d, t, "system", "loan.defaulted", l.id, { studentId: l.studentId, daysPastDue: dpd });
    } else if (dpd > p.repayment.graceDays && l.status === "active") {
      l.status = "overdue";
      if (account) notify(d, account, t, "overdue", NOTE.overdue(amountDue(l), l.dueDate), l.id);
    }
  }
}

function sendReminders(d: Draft<WorldState>, t: number, p: Policy) {
  const today = istDate(t);
  for (const l of Object.values(d.loans).sort((a, b) => a.id.localeCompare(b.id))) {
    if (!isOpen(l)) continue;
    const account = d.students[l.studentId]?.accountId;
    if (!account) continue;
    const toDue = daysBetween(today, l.dueDate);
    const owed = amountDue(l);
    if (toDue > 0 && p.reminders.daysBefore.includes(toDue)) notify(d, account, t, "reminder", NOTE.reminderDueIn(owed, toDue, l.dueDate), l.id);
    else if (toDue === 0 && p.reminders.onDueDate) notify(d, account, t, "reminder", NOTE.reminderDueToday(owed), l.id);
    else if (toDue < 0 && p.reminders.daysAfter.includes(-toDue) && l.status !== "defaulted") notify(d, account, t, "reminder", NOTE.reminderAfter(owed, -toDue, l.dueDate), l.id);
  }
}

function processInstant(d: Draft<WorldState>, t: number, p: Policy) {
  const date = istDate(t);
  if (t === istStartOf(date, 0)) {
    checkUtilisation(d, t, istDate(t - 1), p); // utilisation when yesterday's loans fell due
    applyTransitions(d, t, p);
  }
  if (t === istStartOf(date, 0) && t > d.lastCutoff) {
    d.lastCutoff = t;
    runFraudRules(d, t, p);
  }
  buildSettlements(d as WorldState, t, p.settlement.delayHours); // each payment settles delayHours after it was made
  if (t === istStartOf(date, p.reminders.atHourIst)) sendReminders(d, t, p);
}

/**
 * Moves the simulated clock to `target`, running every scheduled step on the way, in order: reminders (09:00),
 * utilisation checks, overdue and default transitions (midnight) and each payment's settlement, 12 hours after it was made. Never goes backwards.
 */
export function advanceTo(world: WorldState, target: number, label?: string): WorldState {
  if (target <= world.clock.now) return world;
  const p = getPolicy();
  return produce(world, (d) => {
    let t = d.clock.now;
    while (t < target) {
      t = Math.min(target, nextBoundary(d as WorldState, t, p));
      d.clock.now = t;
      processInstant(d, t, p);
    }
    if (label) d.clock.history.push({ at: target, label });
  });
}

/** Records an entry in the append-only audit log (role switches, overrides, ops actions). */
export function recordAudit(world: WorldState, entry: { actor: string; action: string; target: string; details?: Record<string, string | number | boolean>; at?: number }): WorldState {
  return produce(world, (d) => audit(d, entry.at ?? d.clock.now, entry.actor, entry.action, entry.target, entry.details ?? {}));
}
