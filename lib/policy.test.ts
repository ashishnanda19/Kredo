import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY, PolicyError, COIN_RUPEES, computeFee, computeInterest, ladderLimit, resolvePolicy, totalRepayable, validatePolicy } from "./policy";

describe("policy", () => {
  it("ships a valid default", () => {
    expect(validatePolicy(DEFAULT_POLICY)).toEqual([]);
  });
  it("one coin is one rupee", () => {
    expect(COIN_RUPEES).toBe(1);
  });
  it("overrides merge deeply and the result is frozen", () => {
    const p = resolvePolicy({ aura: { blockBelowAura: 25 } });
    expect(p.aura.blockBelowAura).toBe(25);
    expect(p.aura.start).toBe(DEFAULT_POLICY.aura.start);
    expect(Object.isFrozen(p)).toBe(true);
  });
  it("rejects unsafe overrides", () => {
    expect(() => resolvePolicy({ repayment: { dueInDaysDefault: 99 } })).toThrow(PolicyError);
    expect(() => resolvePolicy({ aura: { blockBelowAura: 200 } })).toThrow(PolicyError);
  });
  it("the ladder never goes down in limit", () => {
    const limits = DEFAULT_POLICY.ladder.levels.map((l) => l.limit);
    expect([...limits].sort((a, b) => a - b)).toEqual(limits);
    expect(ladderLimit(1)).toBe(1000);
    expect(ladderLimit(99)).toBe(ladderLimit(DEFAULT_POLICY.ladder.levels.length));
  });
  it("costs are fee + interest, rounded to whole rupees", () => {
    const t = totalRepayable(1000, 15);
    expect(t.fee).toBe(computeFee(1000));
    expect(t.interest).toBe(computeInterest(1000, 15));
    expect(t.total).toBe(1000 + t.fee + t.interest);
    expect(Number.isInteger(t.total)).toBe(true);
  });
  it("the KRS mapping is the single Aura formula", () => {
    expect(DEFAULT_POLICY.aura.krsBase).toBe(400);
    expect(DEFAULT_POLICY.aura.krsPerAura).toBe(4);
  });
});
