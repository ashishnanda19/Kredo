/**
 * Policy: every fee, rate, limit, window, threshold and cut-off the MVP demo uses. Nothing here is hard-coded in a
 * component, because the lending partner (NBFC) has the final say and will override these values.
 *
 * ALL VALUES ARE PLACEHOLDERS for a simulated demo. They are the open questions in docs/MVP_DEMO_PROMPT.md (A6):
 *   interest and fees (A6.4), limits and default definition (A6.5), settlement timing and vendor fee (A6.2, A6.3).
 *
 * MONEY BOUNDARY: 1 coin = ₹1 and a coin is a DISPLAY unit only. Kredo never holds, loads, pools or moves money. Real
 * money would flow only NBFC → vendor bank account (settlement) and student → NBFC (repayment).
 *
 * `resolvePolicy(overrides)` merges and validates; a config that breaks a safety rail does not load.
 */
import { PRICING } from "./config";

/** 1 coin = ₹1, always. A display unit; there is no wallet, balance, top-up or transfer anywhere in this app. */
export const COIN_RUPEES = 1 as const;

export type QuestId = "verify_identity" | "verify_bank" | "set_reminders" | "streak_3" | "micro_spend";
export const QUEST_IDS: readonly QuestId[] = ["verify_identity", "verify_bank", "set_reminders", "streak_3", "micro_spend"];

export interface QuestDef {
  id: QuestId;
  title: string;
  /** Aura points. Only quests that change repayment risk may carry any. */
  aura: number;
  /** once: one time; per_streak: once for each streak of N on-time repayments; once_per_recovery: once after each default. */
  cap: "once" | "per_streak" | "once_per_recovery";
  riskReducing: true;
}

export interface LadderLevel {
  level: number;
  /** Sanctioned limit in coins (= ₹). */
  limit: number;
  /** Aura needed to step UP to this level (0 for the first level). */
  minAura: number;
}

export interface Policy {
  version: string;
  repayment: {
    dueInDaysDefault: number;
    dueInDaysMin: number;
    dueInDaysMax: number;
    /** Paid within this many days after the due date still counts as on time. */
    graceDays: number;
    /** More than this many days past due is a default. */
    defaultAfterDays: number;
  };
  pricing: {
    /** Flat ₹ per payment (from PRICING.platformFee). */
    platformFee: number;
    /** Flat interest, percent per 30 days, pro-rated to the repayment window. PLACEHOLDER until the NBFC confirms. */
    interestPercentPer30Days: number;
  };
  aura: {
    start: number;
    /** Below this Aura, new spends are blocked. */
    blockBelowAura: number;
    krsBase: number;
    krsPerAura: number;
    krsMin: number;
    krsMax: number;
    /** Events older than this are weighted `recencyWeight` in the displayed score. */
    recencyDays: number;
    recencyWeight: number;
    deltas: {
      onTime: number;
      withinGrace: number;
      late1to7: number;
      late8to30: number;
      default: number;
      partialPaid: number;
      earlyClose: number;
      highUtilisation: number;
    };
    /** Every Nth consecutive scored on-time repayment earns an extra bonus. */
    onTimeBonusEvery: number;
    onTimeBonus: number;
    /**
     * Anti-farming: repayment rewards (on-time, early close, partial) pay out at most once per this many days. Many
     * tiny loans repaid one after another must not be a way to buy Aura: the score rewards repaying, never borrowing.
     */
    rewardCooldownDays: number;
    /** A full repayment at least this many days before the due date is an early close. */
    earlyCloseDays: number;
    /** Utilisation (outstanding principal / sanctioned limit) above this percent at the due time costs Aura. */
    highUtilisationPercent: number;
  };
  tiers: {
    /** Fewer repayment outcomes than this is "Fresh Spawn", whatever the Aura. */
    freshSpawnBelowRepayments: number;
    /** Inclusive lower bounds, ascending. */
    bands: { id: TierId; from: number }[];
  };
  ladder: {
    levels: LadderLevel[];
    /** Consecutive scored on-time repayments needed for each step up. */
    onTimeToStepUp: number;
    /** Minimum days between step-ups (the full engine uses 30; 0 keeps the demo's 6-week seed reachable). */
    stepUpCooldownDays: number;
    /** Levels lost on a repayment 8 to 30 days late. A default always drops to the first level. */
    dropOnLate8to30: number;
    /** When true a step up waits for the lender's approval instead of applying with a notice. */
    increaseRequiresNbfcApproval: boolean;
  };
  defaultMemory: {
    /** Per-spend cap in coins after a default, until recovered. */
    postDefaultCap: number;
    /** On-time repayments needed after the defaulted amount is cleared before the cap lifts. */
    onTimeToRecover: number;
    /** Days after clearing before any limit increase. */
    coolingOffDays: number;
  };
  quests: {
    list: QuestDef[];
    /** Quest Aura can add at most this much in any rolling 30 days. */
    capAuraPer30Days: number;
    /** The "proof of repayment" micro-spend. Only if the lender permits it. */
    microSpend: { enabled: boolean; coins: number; dueInDays: number };
  };
  vendor: {
    /** Daily receivable cap in coins by verification level. "light" is a small stall with no registration. */
    dailyCapCoins: { full: number; light: number };
  };
  velocity: {
    student: { perHour: { count: number; coins: number }; perDay: { count: number; coins: number } };
    vendor: { perHour: { count: number; coins: number } };
  };
  /** Fraud rules (rules, not a model). Each raises a flag for ops; none blocks a payment on its own. */
  fraud: {
    /** Round-amount clustering: this many round payments to one stall in the window before the cut-off. */
    roundWindowHours: number;
    roundMinCount: number;
    /** A payment is "round" when it is a multiple of this many coins. */
    roundMultiple: number;
    /** Concentration: one student paying at least this percent of a stall's coins over 7 days, once the stall has this many coins. */
    concentrationPercent: number;
    concentrationMinCoins: number;
  };
  refunds: {
    /** Refunds a vendor may raise per rolling 7 days. */
    maxPerVendorPer7Days: number;
    /** A refund above this many coins needs ops approval. */
    opsApprovalAboveCoins: number;
  };
  settlement: {
    /** Cut-off hour in India time. 0 is midnight. */
    cutoffHourIst: number;
    mode: "t0_midnight" | "t1";
    /** Fee charged to the vendor, percent. Default 0 (A6.3). */
    vendorFeePercent: number;
  };
  reminders: {
    atHourIst: number;
    daysBefore: number[];
    onDueDate: boolean;
    daysAfter: number[];
  };
  session: {
    /** Switching role needs a PIN or OTP again if the last confirmation is older than this. */
    roleSwitchReauthMinutes: number;
  };
  qr: {
    /** Lifetime of a QR that carries a fixed amount. */
    amountTokenTtlSeconds: number;
  };
}

export type TierId = "fresh_spawn" | "reset_arc" | "side_quest" | "locked_in" | "main_character" | "aura_farmer";

export const DEFAULT_POLICY: Policy = {
  version: "mvp-demo-2026-11",
  repayment: { dueInDaysDefault: PRICING.dueInDays, dueInDaysMin: 15, dueInDaysMax: 30, graceDays: 1, defaultAfterDays: 30 },
  pricing: { platformFee: PRICING.platformFee, interestPercentPer30Days: 1.5 },
  aura: {
    start: 50,
    blockBelowAura: 20,
    krsBase: 400,
    krsPerAura: 4,
    krsMin: 400,
    krsMax: 800,
    recencyDays: 90,
    recencyWeight: 0.5,
    deltas: { onTime: 3, withinGrace: 0, late1to7: -4, late8to30: -10, default: -25, partialPaid: 1, earlyClose: 1, highUtilisation: -2 },
    onTimeBonusEvery: 3,
    onTimeBonus: 1,
    rewardCooldownDays: 7,
    earlyCloseDays: 2,
    highUtilisationPercent: 90,
  },
  tiers: {
    freshSpawnBelowRepayments: 2,
    bands: [
      { id: "reset_arc", from: 0 },
      { id: "side_quest", from: 30 },
      { id: "locked_in", from: 50 },
      { id: "main_character", from: 70 },
      { id: "aura_farmer", from: 85 },
    ],
  },
  ladder: {
    levels: [
      { level: 1, limit: 1000, minAura: 0 },
      { level: 2, limit: 2000, minAura: 40 },
      { level: 3, limit: 3000, minAura: 50 },
      { level: 4, limit: 5000, minAura: 60 },
      { level: 5, limit: 7500, minAura: 70 },
      { level: 6, limit: 10000, minAura: 80 },
    ],
    onTimeToStepUp: 2,
    stepUpCooldownDays: 0,
    dropOnLate8to30: 1,
    increaseRequiresNbfcApproval: false,
  },
  defaultMemory: { postDefaultCap: 500, onTimeToRecover: 3, coolingOffDays: 14 },
  quests: {
    list: [
      { id: "verify_identity", title: "Verify phone, email and college ID", aura: 2, cap: "once", riskReducing: true },
      { id: "verify_bank", title: "Verify your repayment bank account or UPI handle", aura: 3, cap: "once", riskReducing: true },
      { id: "set_reminders", title: "Set repayment reminders and acknowledge the due-date notice", aura: 1, cap: "once", riskReducing: true },
      { id: "streak_3", title: "Keep a streak of 3 on-time repayments", aura: 3, cap: "per_streak", riskReducing: true },
      { id: "micro_spend", title: "Repay a small proof-of-repayment spend on time", aura: 4, cap: "once_per_recovery", riskReducing: true },
    ],
    capAuraPer30Days: 8,
    microSpend: { enabled: true, coins: 50, dueInDays: 7 },
  },
  vendor: { dailyCapCoins: { full: 20000, light: 5000 } },
  velocity: {
    student: { perHour: { count: 5, coins: 1500 }, perDay: { count: 15, coins: 4000 } },
    vendor: { perHour: { count: 120, coins: 15000 } },
  },
  fraud: { roundWindowHours: 2, roundMinCount: 3, roundMultiple: 100, concentrationPercent: 60, concentrationMinCoins: 500 },
  refunds: { maxPerVendorPer7Days: 5, opsApprovalAboveCoins: 500 },
  settlement: { cutoffHourIst: 0, mode: "t0_midnight", vendorFeePercent: 0 },
  reminders: { atHourIst: 9, daysBefore: [3, 1], onDueDate: true, daysAfter: [1, 3, 7] },
  session: { roleSwitchReauthMinutes: 10 },
  qr: { amountTokenTtlSeconds: 300 },
};

export class PolicyError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid policy: ${issues.join("; ")}`);
    this.name = "PolicyError";
  }
}

const isInt = (n: number) => Number.isInteger(n);

/** The safety rails. Returns every problem found (empty means the policy is safe to load). */
export function validatePolicy(p: Policy): string[] {
  const bad: string[] = [];
  const r = p.repayment;
  if (!(r.dueInDaysMin >= 1 && r.dueInDaysMin <= r.dueInDaysDefault && r.dueInDaysDefault <= r.dueInDaysMax)) bad.push("repayment window must satisfy min <= default <= max");
  if (!(r.graceDays >= 0 && isInt(r.graceDays))) bad.push("grace days must be a whole number of 0 or more");
  if (!(r.defaultAfterDays > r.graceDays)) bad.push("the default point must come after the grace period");
  if (!(isInt(p.pricing.platformFee) && p.pricing.platformFee >= 0)) bad.push("platform fee must be a whole number of rupees, 0 or more");
  if (!(p.pricing.interestPercentPer30Days >= 0 && p.pricing.interestPercentPer30Days <= 10)) bad.push("interest must be between 0 and 10 percent per 30 days");

  const a = p.aura;
  if (!(a.start >= 0 && a.start <= 100)) bad.push("starting Aura must be between 0 and 100");
  if (!(a.blockBelowAura >= 0 && a.blockBelowAura <= 100)) bad.push("the block threshold must be between 0 and 100");
  if (a.krsMax !== a.krsBase + a.krsPerAura * 100 || a.krsMin !== a.krsBase) bad.push("KRS mapping must be base + per-Aura x Aura, from 0 to 100");
  const d = a.deltas;
  if (!(d.onTime > 0 && d.partialPaid >= 0 && d.earlyClose >= 0)) bad.push("rewards must be positive: paying on time can never lower Aura");
  if (!(d.withinGrace === 0)) bad.push("repaying within the grace day must be neutral");
  if (!(d.late1to7 <= 0 && d.late8to30 <= d.late1to7 && d.default <= d.late8to30 && d.highUtilisation <= 0)) bad.push("penalties must not be positive and must grow with lateness");
  if (!(a.rewardCooldownDays >= 1)) bad.push("reward cooldown must be at least 1 day (the anti-farming rail)");
  if (!(a.recencyWeight > 0 && a.recencyWeight <= 1 && a.recencyDays >= 1)) bad.push("recency weight must be in (0, 1] and the window at least 1 day");
  if (!(a.onTimeBonusEvery >= 2 && a.onTimeBonus >= 0)) bad.push("on-time bonus must be every 2nd or later repayment");
  if (!(a.highUtilisationPercent > 0 && a.highUtilisationPercent <= 100)) bad.push("high-utilisation threshold must be a percent");

  const bands = p.tiers.bands;
  if (!(bands.length > 0 && bands[0].from === 0 && bands.every((b, i) => i === 0 || b.from > bands[i - 1].from))) bad.push("tier bands must start at 0 and rise");

  const lv = p.ladder.levels;
  if (!(lv.length >= 2 && lv.every((l, i) => l.level === i + 1))) bad.push("ladder levels must be 1, 2, 3 ... in order");
  if (!lv.every((l, i) => i === 0 || l.limit > lv[i - 1].limit)) bad.push("ladder limits must rise level by level");
  if (!(lv[0]?.minAura === 0 && lv.every((l, i) => i === 0 || l.minAura >= lv[i - 1].minAura))) bad.push("ladder minimum Aura must start at 0 and never fall");
  if (!(p.ladder.onTimeToStepUp >= 1 && p.ladder.stepUpCooldownDays >= 0 && p.ladder.dropOnLate8to30 >= 0)) bad.push("ladder step rules must be non-negative (at least 1 repayment per step)");

  const m = p.defaultMemory;
  if (!(m.postDefaultCap > 0 && m.postDefaultCap <= (lv[0]?.limit ?? 0))) bad.push("the post-default cap must be positive and no larger than the first ladder limit");
  if (!(m.onTimeToRecover >= 1 && m.coolingOffDays >= 0)) bad.push("recovery needs at least 1 on-time repayment and a non-negative cooling-off");

  const q = p.quests;
  const ids = q.list.map((x) => x.id);
  if (new Set(ids).size !== ids.length) bad.push("quest ids must be unique");
  for (const x of q.list) {
    if (!QUEST_IDS.includes(x.id)) bad.push(`quest "${x.id}" is not a risk-reducing quest and cannot carry Aura`);
    if (x.riskReducing !== true) bad.push(`quest "${x.id}" must be risk-reducing`);
    if (!(x.aura > 0 && x.aura <= 5)) bad.push(`quest "${x.id}" Aura must be between 1 and 5`);
  }
  if (!(q.capAuraPer30Days >= 0 && q.capAuraPer30Days <= 10)) bad.push("quest Aura cap per 30 days must be between 0 and 10 (the anti-farming rail)");
  if (!(q.microSpend.coins > 0 && q.microSpend.coins <= m.postDefaultCap && q.microSpend.dueInDays >= 1 && q.microSpend.dueInDays <= r.dueInDaysMax)) bad.push("the micro-spend must be small (within the post-default cap) with a due window of 1 day or more");

  const v = p.vendor.dailyCapCoins;
  if (!(v.light > 0 && v.full >= v.light)) bad.push("vendor daily caps must be positive and the full cap at least the light cap");
  const vel = p.velocity;
  for (const w of [vel.student.perHour, vel.student.perDay, vel.vendor.perHour]) if (!(w.count > 0 && w.coins > 0)) bad.push("velocity limits must be positive");
  const f = p.fraud;
  if (!(f.roundWindowHours >= 1 && f.roundMinCount >= 2 && f.roundMultiple >= 10 && f.concentrationPercent > 0 && f.concentrationPercent <= 100 && f.concentrationMinCoins > 0)) bad.push("fraud rule thresholds must be positive (round amounts at least 10 coins, concentration 1 to 100 percent)");
  if (!(p.refunds.maxPerVendorPer7Days >= 0 && p.refunds.opsApprovalAboveCoins > 0)) bad.push("refund caps must be positive");
  const s = p.settlement;
  if (!(isInt(s.cutoffHourIst) && s.cutoffHourIst >= 0 && s.cutoffHourIst <= 23)) bad.push("settlement cut-off hour must be 0 to 23");
  if (!(s.vendorFeePercent >= 0 && s.vendorFeePercent <= 100)) bad.push("vendor fee must be 0 to 100 percent");
  if (!(p.reminders.daysBefore.every((n) => n >= 1) && p.reminders.daysAfter.every((n) => n >= 1))) bad.push("reminder offsets must be 1 day or more");
  if (!(p.session.roleSwitchReauthMinutes >= 0)) bad.push("role-switch re-authentication window must be 0 or more minutes");
  return bad;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

function merge<T>(base: T, over: unknown): T {
  if (over === undefined) return base;
  if (Array.isArray(base) || base === null || typeof base !== "object" || typeof over !== "object" || over === null || Array.isArray(over)) return over as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) out[k] = merge((base as Record<string, unknown>)[k], v);
  return out as T;
}

function freeze<T>(x: T): T {
  if (x && typeof x === "object") {
    Object.values(x as Record<string, unknown>).forEach(freeze);
    Object.freeze(x);
  }
  return x;
}

/** The lender's overrides on top of the defaults, validated. Throws PolicyError if any safety rail breaks. */
export function resolvePolicy(overrides: DeepPartial<Policy> = {}): Policy {
  const merged = merge(DEFAULT_POLICY, overrides);
  const issues = validatePolicy(merged);
  if (issues.length) throw new PolicyError(issues);
  return freeze(structuredClone(merged));
}

let active: Policy = resolvePolicy();

/** The policy in force. Components and engines read it here; none hard-codes a number. */
export const getPolicy = (): Policy => active;

/** Replace the policy in force (the lender's override, or a test). Validated like resolvePolicy. */
export function setPolicy(overrides: DeepPartial<Policy> = {}): Policy {
  active = resolvePolicy(overrides);
  return active;
}

// derived money helpers -------------------------------------------------------------------------------------------

/** Rounds to a whole rupee, halves up. */
export const roundRupees = (x: number) => Math.round(x + Number.EPSILON);

export function computeFee(_coins: number, p: Policy = active): number {
  return p.pricing.platformFee;
}

export function computeInterest(coins: number, termDays: number, p: Policy = active): number {
  return roundRupees((coins * p.pricing.interestPercentPer30Days * termDays) / (100 * 30));
}

export function totalRepayable(coins: number, termDays: number, p: Policy = active): { fee: number; interest: number; total: number } {
  const fee = computeFee(coins, p);
  const interest = computeInterest(coins, termDays, p);
  return { fee, interest, total: coins * COIN_RUPEES + fee + interest };
}

export const ladderLimit = (level: number, p: Policy = active): number => p.ladder.levels[Math.max(1, Math.min(level, p.ladder.levels.length)) - 1].limit;
