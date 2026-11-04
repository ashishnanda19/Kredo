/**
 * The quests and the way back. Pure views over the event log:
 *  - which quests are open, done, capped or locked, with the Aura each would add today;
 *  - the ordered recovery plan for someone whose spends are paused: clear what is overdue, do the allowed quests,
 *    then the optional small proof-of-repayment payment.
 *
 * Wording is calm and specific. Nothing here shames a low score or counts down to anything.
 */
import { deriveState } from "../aura/engine";
import { getPolicy, type QuestId } from "../policy";
import { amountDue, blockedReason, pastGraceLoans, studentEvents, studentState } from "./selectors";
import { DAY } from "./time";
import type { Loan, WorldState } from "./types";
import { microSpendEligible } from "./pay";
import { awardQuest } from "./world";

export type QuestStatus = "done" | "available" | "capped" | "needs_overdue_paid" | "locked";

export interface QuestView {
  id: QuestId;
  title: string;
  /** Aura this quest would add today (0 when it would add nothing). */
  aura: number;
  status: QuestStatus;
  /** Plain explanation for anything that is not available. */
  note?: string;
  /** A person triggers it with a button. Streak and micro-spend are earned by repaying, not tapped. */
  manual: boolean;
}

const MANUAL: QuestId[] = ["verify_identity", "verify_bank", "set_reminders"];

export function questViews(w: WorldState, studentId: string, at: number = w.clock.now): QuestView[] {
  const p = getPolicy();
  const events = studentEvents(w, studentId);
  const state = deriveState(events, at, p);
  const overdue = pastGraceLoans(w, studentId, at).length > 0;
  return p.quests.list.map((def) => {
    const base = { id: def.id, title: def.title, manual: MANUAL.includes(def.id) };
    const probe = awardQuest(w, studentId, def.id, at);
    if (probe.result.draft) return { ...base, aura: probe.result.draft.delta, status: "available" as const };
    switch (probe.result.rejected) {
      case "ALREADY_DONE":
        return { ...base, aura: 0, status: "done" as const };
      case "CAP_REACHED": {
        const oldest = events.filter((e) => e.kind.startsWith("QUEST_") && e.at > at - 30 * DAY && e.delta > 0).sort((a, b) => a.at - b.at)[0];
        const days = oldest ? Math.max(1, Math.ceil((oldest.at + 30 * DAY - at) / DAY)) : 30;
        return { ...base, aura: 0, status: "capped" as const, note: `Quest points are limited to ${p.quests.capAuraPer30Days} every 30 days. More open up in about ${days} day${days === 1 ? "" : "s"}.` };
      }
      case "OVERDUE_CEILING":
        return { ...base, aura: 0, status: "needs_overdue_paid" as const, note: "Pay the overdue amount first. Quests can't lift you above the minimum while something is overdue." };
      default:
        if (def.id === "streak_3") return { ...base, aura: 0, status: "locked" as const, note: `Repay on time three times in a row (${Math.min(state.consecutiveOnTime, 3)} of 3 so far).` };
        if (def.id === "micro_spend") return { ...base, aura: 0, status: "locked" as const, note: overdue ? "Available once what is overdue is paid." : "Only available while you're rebuilding after a missed repayment." };
        return { ...base, aura: 0, status: "locked" as const };
    }
  });
}

export type StepState = "done" | "next" | "waiting";
export interface RecoveryStep {
  id: "clear_overdue" | "quests" | "micro_spend" | "back_on_track";
  title: string;
  body: string;
  state: StepState;
}

export interface RecoveryPlan {
  blocked: ReturnType<typeof blockedReason>;
  aura: number;
  threshold: number;
  overdueLoans: Loan[];
  overdueOwed: number;
  quests: QuestView[];
  /** Aura the open quests could add together right now. */
  questPotential: number;
  microEligible: boolean;
  microCoins: number;
  microDays: number;
  steps: RecoveryStep[];
  estimate: string;
}

export function recoveryPlan(w: WorldState, studentId: string, at: number = w.clock.now): RecoveryPlan {
  const p = getPolicy();
  const state = studentState(w, studentId, at);
  const blocked = blockedReason(w, studentId, at);
  const overdueLoans = pastGraceLoans(w, studentId, at);
  const overdueOwed = overdueLoans.reduce((s, l) => s + amountDue(l), 0);
  const quests = questViews(w, studentId, at);

  // what the open quests could add together, applied one after another so the 30-day cap is respected
  let scratch = w;
  for (const q of quests.filter((x) => x.manual && x.status === "available")) scratch = awardQuest(scratch, studentId, q.id, at).world;
  const questPotential = studentState(scratch, studentId, at).aura - state.aura;

  const micro = p.quests.microSpend;
  const microEligible = microSpendEligible(w, studentId, at);
  const manualOpen = quests.some((q) => q.manual && q.status === "available");
  const threshold = p.aura.blockBelowAura;

  const steps: RecoveryStep[] = [
    {
      id: "clear_overdue",
      title: "Pay what is overdue",
      body: overdueLoans.length ? `₹${overdueOwed} across ${overdueLoans.length} payment${overdueLoans.length === 1 ? "" : "s"} is past its due date. Paying it lifts the pause on spending.` : "Nothing is overdue.",
      state: overdueLoans.length ? "next" : "done",
    },
    {
      id: "quests",
      title: "Do the quests that lower your risk",
      body: manualOpen ? `Open quests could add up to ${questPotential} Aura today. They're capped at ${p.quests.capAuraPer30Days} per 30 days.` : "No quests are open right now.",
      state: overdueLoans.length ? "waiting" : manualOpen ? "next" : "done",
    },
    {
      id: "micro_spend",
      title: `Optional: a small ₹${micro.coins} proof-of-repayment payment`,
      body: micro.enabled ? `Pay a stall ₹${micro.coins}, then repay it within ${micro.dueInDays} days. Repaid on time, it adds Aura once.` : "Not available right now.",
      state: !micro.enabled || state.microSpendDone ? "done" : overdueLoans.length ? "waiting" : microEligible ? "next" : "done",
    },
    {
      id: "back_on_track",
      title: "Back above the minimum",
      body: `Spending resumes when nothing is overdue and your Aura is ${threshold} or more.`,
      state: blocked ? "waiting" : "done",
    },
  ];

  let estimate: string;
  if (!blocked) estimate = "You're clear to spend.";
  else if (overdueLoans.length) estimate = `Spending can resume as soon as the ₹${overdueOwed} is paid and your Aura is ${threshold} or more. It is ${state.aura} now, so a few quests may be needed after that.`;
  else if (questPotential >= threshold - state.aura) estimate = `The open quests can bring your Aura to ${threshold} today.`;
  else if (micro.enabled && microEligible) estimate = `The open quests add ${questPotential}, which isn't enough on its own. The rest comes from repaying on time: the small proof-of-repayment payment takes about ${micro.dueInDays} days.`;
  else estimate = `You need ${threshold - state.aura} more Aura. Repaying on time over the next few weeks is how it grows.`;

  return { blocked, aura: state.aura, threshold, overdueLoans, overdueOwed, quests, questPotential, microEligible, microCoins: micro.coins, microDays: micro.dueInDays, steps, estimate };
}
