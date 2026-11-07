/**
 * The MVP Aura engine (docs/MVP_DEMO_PROMPT.md, B8). Pure and deterministic: the same events and the same `now`
 * always give the same answer. There is ONE number underneath (KRS = 400 + 4 x Aura); Aura is only its display layer.
 *
 * Nothing is stored except raw score events. Aura, tier, limit level, streak, default memory and quest state are all
 * recomputed from them (`deriveState`), which keeps every change auditable and explainable.
 *
 * Principles it enforces:
 *  - reward repaying, never borrowing: repayment rewards pay out at most once per `rewardCooldownDays`, so a pile of
 *    tiny loans repaid one by one cannot buy Aura; only quests that really change repayment risk carry points;
 *  - paying on time can never lower Aura; penalties grow with lateness;
 *  - never shame: every effect carries a plain-English reason.
 *
 * This is a simplified stand-in for the full scorecard service (services/score). It sits behind the ScoreProvider
 * interface (lib/api/score-provider.ts) so that service can replace it later.
 */
import { DAY, daysBetween, istDate, daysPastDue } from "../domain/time";
import type { ScoreEvent, ScoreEventKind } from "../domain/types";
import { getPolicy, type Policy, type QuestId, type TierId } from "../policy";

export const QUEST_KIND: Record<QuestId, ScoreEventKind> = {
  verify_identity: "QUEST_VERIFY_IDENTITY",
  verify_bank: "QUEST_VERIFY_BANK",
  set_reminders: "QUEST_SET_REMINDERS",
  streak_3: "QUEST_STREAK_3",
  micro_spend: "QUEST_MICRO_SPEND",
};
const QUEST_OF_KIND = Object.fromEntries(Object.entries(QUEST_KIND).map(([q, k]) => [k, q])) as Record<string, QuestId>;
const isQuest = (k: ScoreEventKind) => k in QUEST_OF_KIND;

export interface StudentState {
  /** 0 to 100, with the recency weight applied. */
  aura: number;
  krs: number;
  tier: TierId;
  level: number;
  /** Sanctioned limit in coins for the current level. */
  limit: number;
  /** Consecutive scored on-time repayments (a late one resets it). */
  consecutiveOnTime: number;
  /** Scored on-time repayments since the last limit step. */
  stepProgress: number;
  /** How many loans have reached an outcome (repaid in any way, or defaulted). */
  repaymentOutcomes: number;
  hasPriorDefault: boolean;
  lastDefaultAt: number | null;
  lastDefaultAmount: number | null;
  defaultClearedAt: number | null;
  onTimeSinceClear: number;
  /** The per-spend cap after a default is in force. */
  postDefaultCapActive: boolean;
  /** No limit increase until this instant (after a default is cleared). */
  coolingOffUntil: number | null;
  lastRewardAt: number | null;
  lastStepUpAt: number | null;
  /** A step up waiting for the lender's approval. */
  pendingIncreaseToLevel: number | null;
  questsDone: QuestId[];
  streakQuestAwarded: boolean;
  microSpendDone: boolean;
}

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export const krsFromAura = (aura: number, p: Policy = getPolicy()) => clamp(p.aura.krsBase + p.aura.krsPerAura * aura, p.aura.krsMin, p.aura.krsMax);
export const auraFromKrs = (krs: number, p: Policy = getPolicy()) => clamp(Math.round((krs - p.aura.krsBase) / p.aura.krsPerAura), 0, 100);

/** The recency weight of an event of a given age: full inside the window, reduced beyond it. */
export function recencyWeight(ageMs: number, p: Policy = getPolicy()): number {
  return ageMs > p.aura.recencyDays * DAY ? p.aura.recencyWeight : 1;
}

export function tierFor(aura: number, repaymentOutcomes: number, p: Policy = getPolicy()): TierId {
  if (repaymentOutcomes < p.tiers.freshSpawnBelowRepayments) return "fresh_spawn";
  let id = p.tiers.bands[0].id;
  for (const b of p.tiers.bands) if (aura >= b.from) id = b.id;
  return id;
}

/** Events in the order they happened (stable for equal times). */
const ordered = (events: readonly ScoreEvent[]) => events.map((e, i) => ({ e, i })).sort((a, b) => a.e.at - b.e.at || a.i - b.i).map((x) => x.e);

/**
 * Recomputes everything about a student from their raw events, as of `now`.
 * The ladder, streak and default memory use the UNweighted history, so a limit never changes just because
 * time passed; only the displayed Aura applies the recency weight.
 */
export function deriveState(events: readonly ScoreEvent[], now: number, p: Policy = getPolicy()): StudentState {
  const lv = p.ladder.levels;
  const top = lv.length;
  let level = 1;
  let consecutive = 0;
  let stepProgress = 0;
  let outcomes = 0;
  let hasPriorDefault = false;
  let lastDefaultAt: number | null = null;
  let lastDefaultAmount: number | null = null;
  let clearedAt: number | null = null;
  let onTimeSinceClear = 0;
  let lastRewardAt: number | null = null;
  let lastStepUpAt: number | null = null;
  let pending: number | null = null;
  let streakAwarded = false;
  let microDone = false;
  const questsDone = new Set<QuestId>();
  let runRaw = 0;
  let weighted = 0;

  for (const e of ordered(events)) {
    if (e.at > now) continue;
    runRaw += e.delta;
    weighted += e.delta * recencyWeight(now - e.at, p);

    switch (e.kind) {
      case "ON_TIME":
        outcomes++;
        if (e.scored !== false) {
          consecutive++;
          stepProgress++;
          lastRewardAt = e.at;
          if (hasPriorDefault && clearedAt !== null) onTimeSinceClear++;
          if (stepProgress >= p.ladder.onTimeToStepUp && level < top) {
            const next = level + 1;
            const auraThen = clamp(p.aura.start + runRaw, 0, 100);
            const cooledOff = clearedAt === null || e.at >= clearedAt + p.defaultMemory.coolingOffDays * DAY;
            const spaced = lastStepUpAt === null || e.at >= lastStepUpAt + p.ladder.stepUpCooldownDays * DAY;
            const defaultOpen = hasPriorDefault && clearedAt === null;
            if (auraThen >= lv[next - 1].minAura && cooledOff && spaced && !defaultOpen) {
              if (p.ladder.increaseRequiresNbfcApproval) pending = next;
              else {
                level = next;
                stepProgress = 0;
                lastStepUpAt = e.at;
              }
            }
          }
        }
        break;
      case "WITHIN_GRACE":
        outcomes++;
        break;
      case "LATE_1_7":
        outcomes++;
        consecutive = 0;
        stepProgress = 0;
        streakAwarded = false;
        break;
      case "LATE_8_30":
        outcomes++;
        consecutive = 0;
        stepProgress = 0;
        streakAwarded = false;
        pending = null;
        level = Math.max(1, level - p.ladder.dropOnLate8to30);
        break;
      case "DEFAULT":
        outcomes++;
        hasPriorDefault = true;
        lastDefaultAt = e.at;
        lastDefaultAmount = typeof e.meta?.amount === "number" ? e.meta.amount : null;
        clearedAt = null;
        onTimeSinceClear = 0;
        level = 1;
        consecutive = 0;
        stepProgress = 0;
        streakAwarded = false;
        microDone = false;
        pending = null;
        break;
      case "DEFAULT_CLEARED":
        clearedAt = e.at;
        onTimeSinceClear = 0;
        break;
      case "EARLY_CLOSE":
        if (e.delta > 0) lastRewardAt = e.at;
        break;
      case "LIMIT_OVERRIDE":
      case "LIMIT_APPROVED":
        if (typeof e.meta?.toLevel === "number") {
          level = e.meta.toLevel;
          stepProgress = 0;
          lastStepUpAt = e.at;
          pending = null;
        }
        break;
      case "QUEST_STREAK_3":
        streakAwarded = true;
        break;
      case "QUEST_MICRO_SPEND":
        microDone = true;
        questsDone.add("micro_spend");
        break;
      default:
        if (isQuest(e.kind)) questsDone.add(QUEST_OF_KIND[e.kind]);
    }
  }

  const aura = clamp(Math.round(p.aura.start + weighted), 0, 100);
  const capActive = hasPriorDefault && !(clearedAt !== null && onTimeSinceClear >= p.defaultMemory.onTimeToRecover);
  return {
    aura,
    krs: krsFromAura(aura, p),
    tier: tierFor(aura, outcomes, p),
    level,
    limit: lv[level - 1].limit,
    consecutiveOnTime: consecutive,
    stepProgress,
    repaymentOutcomes: outcomes,
    hasPriorDefault,
    lastDefaultAt,
    lastDefaultAmount,
    defaultClearedAt: clearedAt,
    onTimeSinceClear,
    postDefaultCapActive: capActive,
    coolingOffUntil: clearedAt === null ? null : clearedAt + p.defaultMemory.coolingOffDays * DAY,
    lastRewardAt,
    lastStepUpAt,
    pendingIncreaseToLevel: pending,
    questsDone: [...questsDone],
    streakQuestAwarded: streakAwarded,
    microSpendDone: microDone,
  };
}

/** What the student can still be asked to pay per spend, after the post-default cap. */
export const postDefaultCap = (s: StudentState, p: Policy = getPolicy()): number | null => (s.postDefaultCapActive ? p.defaultMemory.postDefaultCap : null);

// event drafts ---------------------------------------------------------------------------------------------------

export interface EventDraft {
  kind: ScoreEventKind;
  delta: number;
  reasonCode: string;
  explanation: string;
  loanId?: string;
  scored?: boolean;
  meta?: Record<string, number | string | boolean>;
}

const rewardWindowOpen = (s: StudentState, at: number, p: Policy) => s.lastRewardAt === null || at >= s.lastRewardAt + p.aura.rewardCooldownDays * DAY;

export interface RepaymentContext {
  state: StudentState;
  loan: { id: string; dueDate: string; defaultedAt?: number };
  at: number;
  /** True when this repayment clears the loan. */
  full: boolean;
  /** Events already recorded for this loan (so once-per-loan rewards stay once). */
  loanEvents: readonly ScoreEvent[];
}

/** The score events a repayment produces, in plain English. Empty for a defaulted loan (its penalty was applied at default). */
export function repaymentDrafts(ctx: RepaymentContext, p: Policy = getPolicy()): EventDraft[] {
  const { state, loan, at, full } = ctx;
  if (loan.defaultedAt !== undefined) return [];
  const dpd = daysPastDue(loan.dueDate, at);
  const out: EventDraft[] = [];
  const open = rewardWindowOpen(state, at, p);
  const had = (kind: ScoreEventKind) => ctx.loanEvents.some((e) => e.kind === kind && e.delta > 0);

  if (full) {
    if (dpd === 0) {
      const bonus = (state.consecutiveOnTime + 1) % p.aura.onTimeBonusEvery === 0 ? p.aura.onTimeBonus : 0;
      if (open) {
        out.push({
          kind: "ON_TIME", delta: p.aura.deltas.onTime + bonus, reasonCode: "ON_TIME", loanId: loan.id, scored: true,
          explanation: bonus ? "Repaid on or before the due date, and it is your third on-time repayment in a row." : "Repaid on or before the due date.",
        });
        if (istDate(at) <= loan.dueDate && daysBetween(istDate(at), loan.dueDate) >= p.aura.earlyCloseDays && !had("EARLY_CLOSE")) {
          out.push({ kind: "EARLY_CLOSE", delta: p.aura.deltas.earlyClose, reasonCode: "EARLY_CLOSE", loanId: loan.id, explanation: "Repaid in full ahead of the due date." });
        }
      } else {
        out.push({
          kind: "ON_TIME", delta: 0, reasonCode: "ON_TIME", loanId: loan.id, scored: false,
          explanation: `Repaid on time. Repayment points are given once every ${p.aura.rewardCooldownDays} days, so this one did not add to your score.`,
        });
      }
    } else if (dpd <= p.repayment.graceDays) {
      out.push({ kind: "WITHIN_GRACE", delta: 0, reasonCode: "WITHIN_GRACE", loanId: loan.id, explanation: "Repaid within the one-day grace period. No change to your score." });
    } else if (dpd <= 7) {
      out.push({ kind: "LATE_1_7", delta: p.aura.deltas.late1to7, reasonCode: "LATE_1_7", loanId: loan.id, explanation: `Repaid ${dpd} days after the due date.` });
    } else {
      out.push({ kind: "LATE_8_30", delta: p.aura.deltas.late8to30, reasonCode: "LATE_8_30", loanId: loan.id, explanation: `Repaid ${dpd} days after the due date.` });
    }
  } else if (dpd === 0 && open && !had("PARTIAL_PAID")) {
    out.push({ kind: "PARTIAL_PAID", delta: p.aura.deltas.partialPaid, reasonCode: "PARTIAL_PAID", loanId: loan.id, explanation: "Part of this coin spend was paid before the due date." });
  }
  return out;
}

export function defaultDraft(loanId: string, amount: number, daysLate: number, p: Policy = getPolicy()): EventDraft {
  return {
    kind: "DEFAULT", delta: p.aura.deltas.default, reasonCode: "DEFAULT", loanId, meta: { amount },
    explanation: `A coin spend was more than ${p.repayment.defaultAfterDays} days past due (${daysLate} days). Paying it in full is the first step back.`,
  };
}

export const defaultClearedDraft = (loanId: string): EventDraft => ({
  kind: "DEFAULT_CLEARED", delta: 0, reasonCode: "DEFAULT_CLEARED", loanId,
  explanation: "The defaulted amount was paid in full. Your recovery period starts now.",
});

export function highUtilDraft(loanId: string, utilisationPercent: number, p: Policy = getPolicy()): EventDraft {
  return {
    kind: "HIGH_UTIL", delta: p.aura.deltas.highUtilisation, reasonCode: "HIGH_UTIL", loanId,
    explanation: `About ${Math.round(utilisationPercent)}% of your limit was in use when a coin spend fell due.`,
  };
}

export type QuestRejection = "NOT_A_QUEST" | "ALREADY_DONE" | "NOT_AVAILABLE" | "CAP_REACHED" | "OVERDUE_CEILING";

export interface QuestResult {
  draft?: EventDraft;
  rejected?: QuestRejection;
}

/**
 * A risk-reducing quest, with the anti-farming limits: once per quest (per streak, per recovery), at most
 * `capAuraPer30Days` of quest Aura in any rolling 30 days, and never lifting Aura above the block threshold
 * while an amount is overdue. A quest that would add nothing is rejected and NOT used up.
 */
export function questAward(events: readonly ScoreEvent[], questId: QuestId, at: number, ctx: { hasOverdue: boolean }, p: Policy = getPolicy()): QuestResult {
  const def = p.quests.list.find((q) => q.id === questId);
  if (!def) return { rejected: "NOT_A_QUEST" };
  const s = deriveState(events, at, p);

  if (def.cap === "once" && s.questsDone.includes(questId)) return { rejected: "ALREADY_DONE" };
  if (def.cap === "per_streak") {
    if (s.consecutiveOnTime < 3) return { rejected: "NOT_AVAILABLE" };
    if (s.streakQuestAwarded) return { rejected: "ALREADY_DONE" };
  }
  if (def.cap === "once_per_recovery") {
    if (!p.quests.microSpend.enabled) return { rejected: "NOT_AVAILABLE" };
    if (!(s.hasPriorDefault || s.aura < p.aura.blockBelowAura)) return { rejected: "NOT_AVAILABLE" };
    if (s.microSpendDone) return { rejected: "ALREADY_DONE" };
  }

  const recent = events.filter((e) => isQuest(e.kind) && e.at <= at && e.at > at - 30 * DAY).reduce((sum, e) => sum + e.delta, 0);
  let delta = Math.min(def.aura, p.quests.capAuraPer30Days - recent);
  let rejected: QuestRejection = "CAP_REACHED";
  if (ctx.hasOverdue) {
    const room = Math.max(0, p.aura.blockBelowAura - 1 - s.aura);
    if (room < delta) rejected = "OVERDUE_CEILING";
    delta = Math.min(delta, room);
  }
  if (delta <= 0) return { rejected };
  return {
    draft: {
      kind: QUEST_KIND[questId], delta, reasonCode: QUEST_KIND[questId], meta: { quest: questId },
      explanation: delta < def.aura ? `${def.title}. Quest points are limited, so this added ${delta} instead of ${def.aura}.` : `${def.title}.`,
    },
  };
}

/** The effect of an event as the student sees it: the raw delta, the weight and the displayed amount. */
export function displayedEffect(e: ScoreEvent, now: number, p: Policy = getPolicy()): { delta: number; weight: number; shown: number } {
  const weight = recencyWeight(now - e.at, p);
  return { delta: e.delta, weight, shown: Math.round(e.delta * weight * 10) / 10 };
}
