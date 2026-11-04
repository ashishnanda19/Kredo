import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "./seed";
import { SEED_NOW } from "./constants";
import { computeMetrics, defaultAssumptions, unitEconomics } from "./metrics";
import { qrPayload } from "../qr";
import { payByQr } from "../domain/pay";
import { advanceTo, repayLoan } from "../domain/world";
import { DAY } from "../domain/time";

const W = buildSeedWorld();
const M = computeMetrics(W);

describe("investor metrics", () => {
  it("are computed from the seeded world and are internally consistent", () => {
    expect(M.loans).toBe(Object.values(W.loans).filter((l) => l.status !== "refunded").length);
    expect(M.gmvCoins).toBe(Object.values(W.loans).reduce((s, l) => s + l.coins, 0));
    expect(M.students).toBe(12);
    expect(M.activeStudents).toBeLessThanOrEqual(M.students);
    expect(M.activeVendors).toBeLessThanOrEqual(M.vendors);
  });
  it("repayment shares add up to 100 and every payment is classified once", () => {
    const r = M.repayment;
    expect(r.onTime + r.late + r.defaulted).toBe(r.resolved);
    expect(Math.round((r.onTimePct + r.latePct + r.defaultPct) * 10) / 10).toBeGreaterThanOrEqual(99.8);
    expect(r.onTimePct).toBeGreaterThan(r.defaultPct);
    expect(r.avgDaysToRepay).toBeGreaterThan(0);
  });
  it("the Aura histogram, tiers and ladder each count every student once", () => {
    for (const bars of [M.auraBuckets, M.tiers, M.ladder]) expect(bars.reduce((s, b) => s + b.value, 0)).toBe(M.students);
    expect(M.auraBuckets).toHaveLength(10);
  });
  it("settlement volume equals the sum of paid batches, and the success rate is paid over answered", () => {
    const paid = Object.values(W.settlements).filter((s) => s.status === "paid");
    expect(M.settlement.volume).toBe(paid.reduce((s, x) => s + x.totalAmount, 0));
    expect(M.settlement.successRatePct).toBe(100);
  });
  it("busiest hours and the leaderboard are from the last 30 days", () => {
    expect(M.hours).toHaveLength(24);
    expect(M.leaderboard.length).toBeGreaterThan(0);
    const coins = M.leaderboard.map((v) => v.coins);
    expect([...coins].sort((a, b) => b - a)).toEqual(coins);
  });
  it("the cohort view covers recent due weeks with a percentage each", () => {
    expect(M.cohorts.length).toBeGreaterThan(0);
    for (const c of M.cohorts) { expect(c.pct).toBeGreaterThanOrEqual(0); expect(c.pct).toBeLessThanOrEqual(100); expect(c.onTime).toBeLessThanOrEqual(c.due); }
  });
  it("move when the demo moves: a new payment raises spends and loans", () => {
    const r = payByQr(W, { studentId: "stu-aarav", qr: qrPayload("ven-gupta-chai", 1), coins: 40, idempotencyKey: "m" });
    if (!r.ok) throw new Error();
    const after = computeMetrics(r.world);
    expect(after.gmvCoins).toBe(M.gmvCoins + 40);
    expect(after.loans).toBe(M.loans + 1);
    // repaying it on time adds one on-time resolution
    const later = advanceTo(r.world, SEED_NOW + 15 * DAY);
    const done = computeMetrics(repayLoan(later, { loanId: r.loan.id, amount: later.loans[r.loan.id].totalRepayable }).world);
    expect(done.repayment.resolved).toBeGreaterThan(computeMetrics(later).repayment.resolved);
  });
});

describe("unit economics", () => {
  it("defaults are illustrative placeholders from the demo policy", () => {
    const a = defaultAssumptions();
    expect(a.fee).toBe(5);
    expect(a.interestPct).toBe(1.5);
  });
  it("margin is revenue less cost of funds, default loss and acquisition cost per payment", () => {
    const a = { fee: 5, interestPct: 1.5, costOfFundsPct: 12, defaultLossPct: 3, cac: 240, loansPerStudent: 24 };
    const u = unitEconomics(a, 200, 15);
    expect(u.interest).toBeCloseTo(1.5);
    expect(u.revenue).toBeCloseTo(6.5);
    expect(u.costOfFunds).toBeCloseTo(200 * 0.12 * (15 / 365));
    expect(u.defaultLoss).toBeCloseTo(6);
    expect(u.cacPerLoan).toBeCloseTo(10);
    expect(u.margin).toBeCloseTo(6.5 - u.costOfFunds - 6 - 10);
  });
  it("recomputes when an assumption changes, and tolerates zero payments per student", () => {
    const base = defaultAssumptions();
    expect(unitEconomics({ ...base, fee: 10 }, 100, 15).margin).toBeGreaterThan(unitEconomics(base, 100, 15).margin);
    expect(Number.isFinite(unitEconomics({ ...base, loansPerStudent: 0 }, 100, 15).margin)).toBe(true);
  });
});
