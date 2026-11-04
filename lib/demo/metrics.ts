/**
 * Investor metrics (docs/MVP_DEMO_PROMPT.md, B12), computed from the demo world. EVERY figure is simulated: the seed
 * is fictional and the live part is whatever the presenter did. The screen says so on every card, and nothing here
 * should ever be quoted as traction.
 */
import { exposureOf } from "../domain/exposure";
import { studentState } from "../domain/selectors";
import { DAY, daysPastDue, istDate, istHour, addDays } from "../domain/time";
import type { WorldState } from "../domain/types";
import { computeFee, getPolicy } from "../policy";

export interface Bar {
  label: string;
  value: number;
}

export interface Metrics {
  gmvCoins: number;
  loans: number;
  students: number;
  vendors: number;
  activeStudents: number;
  activeVendors: number;
  repayment: { resolved: number; onTime: number; late: number; defaulted: number; onTimePct: number; latePct: number; defaultPct: number; avgDaysToRepay: number; delinquent30Pct: number };
  settlement: { volume: number; count: number; paid: number; failed: number; onHold: number; successRatePct: number };
  auraBuckets: Bar[];
  tiers: Bar[];
  ladder: Bar[];
  leaderboard: { stallName: string; coins: number; payments: number }[];
  hours: Bar[];
  cohorts: { week: string; due: number; onTime: number; pct: number }[];
  avgTicket: number;
  avgTermDays: number;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const ACTIVE_DAYS = 30;

/** Monday of the week containing an India-time date. */
function weekStart(date: string): string {
  const dow = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

export function computeMetrics(w: WorldState): Metrics {
  const now = w.clock.now;
  const since = now - ACTIVE_DAYS * DAY;
  const loans = Object.values(w.loans).filter((l) => l.status !== "refunded");
  const recent = loans.filter((l) => l.createdAt > since);

  const resolved = loans.filter((l) => l.status === "paid" || l.defaultedAt !== undefined);
  const defaulted = resolved.filter((l) => l.defaultedAt !== undefined).length;
  const paid = resolved.filter((l) => l.defaultedAt === undefined);
  const onTime = paid.filter((l) => daysPastDue(l.dueDate, l.closedAt ?? now) === 0).length;
  const late = paid.length - onTime;
  const closed = loans.filter((l) => l.status === "paid" && l.closedAt !== undefined);
  const avgDays = closed.length ? closed.reduce((s, l) => s + (l.closedAt! - l.createdAt) / DAY, 0) / closed.length : 0;

  const sets = Object.values(w.settlements);
  const paidSets = sets.filter((s) => s.status === "paid");
  const settled = sets.filter((s) => s.status !== "scheduled" && s.status !== "processing");

  const students = Object.values(w.students).filter((s) => s.verification === "accepted").length;
  const aura = Object.keys(w.students).map((id) => studentState(w, id));
  const auraBuckets: Bar[] = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}${i === 9 ? " to 100" : ` to ${i * 10 + 9}`}`, value: aura.filter((s) => Math.min(9, Math.floor(s.aura / 10)) === i).length }));
  const tierOrder = ["fresh_spawn", "reset_arc", "side_quest", "locked_in", "main_character", "aura_farmer"];
  const tiers: Bar[] = tierOrder.map((t) => ({ label: t, value: aura.filter((s) => s.tier === t).length }));
  const ladder: Bar[] = getPolicy().ladder.levels.map((l, i) => ({ label: `Step ${i + 1}: ${l.limit} coins`, value: aura.filter((s) => s.level === i + 1).length }));

  const byVendor = new Map<string, { coins: number; payments: number }>();
  for (const l of recent) {
    const c = byVendor.get(l.vendorId) ?? { coins: 0, payments: 0 };
    c.coins += l.coins;
    c.payments++;
    byVendor.set(l.vendorId, c);
  }
  const leaderboard = [...byVendor.entries()].sort((a, b) => b[1].coins - a[1].coins || a[0].localeCompare(b[0])).slice(0, 5).map(([id, v]) => ({ stallName: w.vendors[id]?.stallName ?? id, ...v }));

  const hours: Bar[] = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}:00`, value: recent.filter((l) => istHour(l.createdAt) === h).length }));

  const today = istDate(now);
  const cohortWeeks = new Map<string, { due: number; onTime: number }>();
  for (const l of loans) {
    if (l.dueDate >= today) continue;
    const key = weekStart(l.dueDate);
    const c = cohortWeeks.get(key) ?? { due: 0, onTime: 0 };
    c.due++;
    if (l.status === "paid" && l.defaultedAt === undefined && daysPastDue(l.dueDate, l.closedAt ?? now) === 0) c.onTime++;
    cohortWeeks.set(key, c);
  }
  const cohorts = [...cohortWeeks.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([week, c]) => ({ week, ...c, pct: pct(c.onTime, c.due) }));

  return {
    gmvCoins: loans.reduce((s, l) => s + l.coins, 0),
    loans: loans.length,
    students,
    vendors: Object.values(w.vendors).filter((v) => v.status === "accepted" || v.status === "suspended").length,
    activeStudents: new Set(recent.map((l) => l.studentId)).size,
    activeVendors: new Set(recent.map((l) => l.vendorId)).size,
    repayment: { resolved: resolved.length, onTime, late, defaulted, onTimePct: pct(onTime, resolved.length), latePct: pct(late, resolved.length), defaultPct: pct(defaulted, resolved.length), avgDaysToRepay: Math.round(avgDays * 10) / 10, delinquent30Pct: exposureOf(w).delinquency30Percent },
    settlement: { volume: paidSets.reduce((s, x) => s + x.totalAmount, 0), count: sets.length, paid: paidSets.length, failed: sets.filter((s) => s.status === "failed").length, onHold: sets.filter((s) => s.status === "on_hold").length, successRatePct: pct(paidSets.length, settled.length) },
    auraBuckets, tiers, ladder, leaderboard, hours, cohorts,
    avgTicket: loans.length ? Math.round(loans.reduce((s, l) => s + l.coins, 0) / loans.length) : 0,
    avgTermDays: loans.length ? Math.round(loans.reduce((s, l) => s + l.termDays, 0) / loans.length) : 0,
  };
}

export interface Assumptions {
  fee: number;
  /** Interest, percent per 30 days. */
  interestPct: number;
  /** The lender's cost of funds, percent per year. */
  costOfFundsPct: number;
  /** Expected loss from defaults, percent of principal. */
  defaultLossPct: number;
  /** Cost to acquire one student, in rupees. */
  cac: number;
  /** How many payments a student makes over their life with the product. */
  loansPerStudent: number;
}

/** ILLUSTRATIVE defaults, not results. The fee and interest are the demo policy's placeholders. */
export const defaultAssumptions = (): Assumptions => ({ fee: computeFee(0), interestPct: getPolicy().pricing.interestPercentPer30Days, costOfFundsPct: 12, defaultLossPct: 3, cac: 150, loansPerStudent: 24 });

export interface UnitEconomics {
  revenue: number;
  interest: number;
  costOfFunds: number;
  defaultLoss: number;
  cacPerLoan: number;
  margin: number;
}

/** Margin on one payment of an average size and term. Revenue is gross: how it is split with the lending partner is not decided. */
export function unitEconomics(a: Assumptions, ticket: number, termDays: number): UnitEconomics {
  const interest = ticket * (a.interestPct / 100) * (termDays / 30);
  const costOfFunds = ticket * (a.costOfFundsPct / 100) * (termDays / 365);
  const defaultLoss = ticket * (a.defaultLossPct / 100);
  const cacPerLoan = a.loansPerStudent > 0 ? a.cac / a.loansPerStudent : 0;
  const revenue = a.fee + interest;
  return { revenue, interest, costOfFunds, defaultLoss, cacPerLoan, margin: revenue - costOfFunds - defaultLoss - cacPerLoan };
}

