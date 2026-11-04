import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "./seed";
import { stallInsights } from "./insights";
import { createLoan } from "../domain/world";

const W = buildSeedWorld();

describe("stall insights", () => {
  const i = stallInsights(W, "ven-gupta-chai");
  it("covers seven days ending today, oldest first", () => {
    expect(i.week).toHaveLength(7);
    expect(i.week[6].coins).toBe(i.today.coins);
    expect(i.week[5].coins).toBe(i.yesterday.coins);
  });
  it("hours add up to the last 30 days of payments, and a busy stall has repeat customers", () => {
    expect(i.hours).toHaveLength(24);
    expect(i.hours.reduce((s, h) => s + h.count, 0)).toBeGreaterThan(0);
    expect(i.avgTicket).toBeGreaterThan(0);
    expect(i.repeatPercent).toBeGreaterThan(0);
    expect(i.repeatPercent).toBeLessThanOrEqual(100);
  });
  it("a new payment shows in today's figures", () => {
    const after = stallInsights(createLoan(W, { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 40, idempotencyKey: "i" }).world, "ven-gupta-chai");
    expect(after.today.coins).toBe(i.today.coins + 40);
    expect(after.today.count).toBe(i.today.count + 1);
  });
  it("a stall with no business has empty, zero figures", () => {
    const e = stallInsights(W, "ven-juice");
    expect(e.avgTicket).toBe(0);
    expect(e.customers30).toBe(0);
  });
});
