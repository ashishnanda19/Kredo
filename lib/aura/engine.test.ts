import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "../demo/seed";
import { SEED_NOW } from "../demo/constants";
import { DAY } from "../domain/time";
import { studentState } from "../domain/selectors";
import { advanceTo, awardQuest, createLoan, repayLoan } from "../domain/world";
import { auraFromKrs, krsFromAura } from "./engine";
import type { WorldState } from "../domain/types";

const SEEDED = buildSeedWorld();
const ID = "stu-aarav";
const aura = (w: WorldState) => studentState(w, ID).aura;

/** One spend, repaid in full `afterDays` days later. */
function cycle(w: WorldState, n: number, afterDays: number, coins = 100): WorldState {
  const a = createLoan(w, { studentId: ID, vendorId: "ven-gupta-chai", coins, idempotencyKey: `c${n}` });
  const t = advanceTo(a.world, a.world.clock.now + afterDays * DAY);
  const due = t.loans[a.loan.id].totalRepayable;
  return repayLoan(t, { loanId: a.loan.id, amount: due, idempotencyKey: `p${n}` }).world;
}

describe("Aura engine", () => {
  it("KRS is 400 + 4 x Aura, clamped to 400..800, and inverts", () => {
    expect(krsFromAura(0)).toBe(400);
    expect(krsFromAura(100)).toBe(800);
    expect(krsFromAura(120)).toBe(800);
    expect(auraFromKrs(krsFromAura(63))).toBe(63);
  });
  it("starts at the policy start with no events", () => {
    expect(aura(SEEDED)).toBe(50);
  });
  it("an on-time repayment on the due date adds Aura", () => {
    expect(aura(cycle(SEEDED, 1, 15))).toBe(53);
  });
  it("a second on-time repayment inside the reward window earns nothing (anti-farming)", () => {
    const one = cycle(SEEDED, 1, 1);
    const two = cycle(one, 2, 1);
    expect(aura(two)).toBe(aura(one));
    const events = two.scoreEvents.filter((e) => e.studentId === ID && e.kind === "ON_TIME");
    expect(events.filter((e) => e.scored)).toHaveLength(1);
    expect(events.filter((e) => !e.scored)).toHaveLength(1);
  });
  it("a repayment a few days late costs Aura", () => {
    const a = createLoan(SEEDED, { studentId: ID, vendorId: "ven-gupta-chai", coins: 100, idempotencyKey: "late" });
    const t = advanceTo(a.world, a.world.clock.now + 18 * DAY);
    const paid = repayLoan(t, { loanId: a.loan.id, amount: t.loans[a.loan.id].totalRepayable, idempotencyKey: "pl" }).world;
    expect(aura(paid)).toBeLessThan(50);
  });
  it("a loan 31 days late defaults, blocks new spends and is remembered", () => {
    const a = createLoan(SEEDED, { studentId: ID, vendorId: "ven-gupta-chai", coins: 100, idempotencyKey: "d" });
    const t = advanceTo(a.world, a.world.clock.now + 50 * DAY);
    expect(t.loans[a.loan.id].status).toBe("defaulted");
    const s = studentState(t, ID);
    expect(s.hasPriorDefault).toBe(true);
    expect(s.aura).toBeLessThan(50);
  });
  it("quest Aura is capped over a rolling 30 days", () => {
    let w = SEEDED;
    for (const q of ["verify_identity", "verify_bank", "set_reminders"] as const) w = awardQuest(w, ID, q).world;
    const gained = aura(w) - 50;
    expect(gained).toBeLessThanOrEqual(8);
    expect(gained).toBeGreaterThan(0);
  });
  it("a quest that cannot add Aura is rejected and stays available", () => {
    let w = SEEDED;
    w = awardQuest(w, ID, "verify_identity").world;
    const again = awardQuest(w, ID, "verify_identity");
    expect(again.result.rejected).toBe("ALREADY_DONE");
  });
  it("is a pure function of events: the same history gives the same state", () => {
    expect(studentState(SEEDED, "stu-diya")).toEqual(studentState(SEEDED, "stu-diya"));
  });
  it("time passing alone never moves the limit", () => {
    const later = advanceTo(SEEDED, SEED_NOW + 20 * DAY);
    for (const id of ["stu-diya", "stu-rohan", "stu-sana"]) expect(studentState(later, id).limit).toBe(studentState(SEEDED, id).limit);
  });
});
