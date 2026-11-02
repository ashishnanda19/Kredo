import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { amountDue } from "./selectors";
import { DomainError, IdempotencyConflict, advanceTo, createLoan, emptyWorld, repayLoan } from "./world";
import { buildSeedWorld } from "../demo/seed";
import { SEED_NOW } from "../demo/constants";
import { DAY } from "./time";

const SEEDED = buildSeedWorld();
const base = () => SEEDED;

describe("createLoan", () => {
  it("is idempotent on its key", () => {
    const w = base();
    const a = createLoan(w, { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 120, idempotencyKey: "k1" });
    const b = createLoan(a.world, { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 120, idempotencyKey: "k1" });
    expect(b.duplicate).toBe(true);
    expect(Object.keys(b.world.loans)).toHaveLength(Object.keys(a.world.loans).length);
  });
  it("refuses the same key with a different body", () => {
    const a = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 120, idempotencyKey: "k1" });
    expect(() => createLoan(a.world, { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 130, idempotencyKey: "k1" })).toThrow(IdempotencyConflict);
  });
  it("rejects bad amounts and unknown parties", () => {
    expect(() => createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 0, idempotencyKey: "x" })).toThrow(DomainError);
    expect(() => createLoan(base(), { studentId: "nobody", vendorId: "ven-gupta-chai", coins: 10, idempotencyKey: "x" })).toThrow(DomainError);
  });
  it("one spend is one loan with costs shown up front", () => {
    const { loan } = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 200, idempotencyKey: "k" });
    expect(loan.totalRepayable).toBe(loan.coins + loan.fee + loan.interest);
    expect(loan.vendorStatus).toBe("received");
  });
});

describe("repayLoan", () => {
  it("allocates fee, then interest, then principal; a full repayment closes the loan", () => {
    const a = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 400, idempotencyKey: "k" });
    const due = amountDue(a.loan);
    const r = repayLoan(a.world, { loanId: a.loan.id, amount: due, idempotencyKey: "r1" });
    expect(r.world.loans[a.loan.id].status).toBe("paid");
    expect(r.repayment.applied.fee + r.repayment.applied.interest + r.repayment.applied.principal).toBe(due);
    expect(r.repayment.applied.fee).toBe(a.loan.fee);
  });
  it("is idempotent, and refuses overpayment", () => {
    const a = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 400, idempotencyKey: "k" });
    const due = amountDue(a.loan);
    const r1 = repayLoan(a.world, { loanId: a.loan.id, amount: 100, idempotencyKey: "r1" });
    const r2 = repayLoan(r1.world, { loanId: a.loan.id, amount: 100, idempotencyKey: "r1" });
    expect(r2.duplicate).toBe(true);
    expect(r2.world.loans[a.loan.id].repaid).toBe(100);
    expect(() => repayLoan(r1.world, { loanId: a.loan.id, amount: due, idempotencyKey: "r2" })).toThrow(DomainError);
    expect(() => repayLoan(r1.world, { loanId: a.loan.id, amount: 99, idempotencyKey: "r1" })).toThrow(IdempotencyConflict);
  });

  it("property: any split of repayments never owes less than zero and never exceeds what was owed", () => {
    fc.assert(
      fc.property(fc.integer({ min: 50, max: 900 }), fc.array(fc.integer({ min: 1, max: 400 }), { minLength: 1, maxLength: 6 }), (coins, parts) => {
        const first = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins, idempotencyKey: "p" });
        const loan = first.loan;
        let world = first.world;
        const total = loan.totalRepayable;
        let paid = 0;
        parts.forEach((x, i) => {
          const left = amountDue(world.loans[loan.id]);
          if (left === 0) return;
          const amt = Math.min(x, left);
          world = repayLoan(world, { loanId: loan.id, amount: amt, idempotencyKey: `r${i}` }).world;
          paid += amt;
        });
        const l = world.loans[loan.id];
        expect(l.repaid).toBe(paid);
        expect(amountDue(l)).toBe(total - paid);
        expect(amountDue(l)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 60 },
    );
  });
});

describe("simulated clock", () => {
  it("never moves backwards", () => {
    const w = base();
    expect(advanceTo(w, w.clock.now - DAY)).toBe(w);
  });
  it("advancing in many steps equals advancing in one", () => {
    const w = base();
    const a = advanceTo(w, SEED_NOW + 5 * DAY);
    let b = w;
    for (let i = 1; i <= 5; i++) b = advanceTo(b, SEED_NOW + i * DAY);
    expect(b.settlements).toEqual(a.settlements);
    expect(b.scoreEvents).toEqual(a.scoreEvents);
    expect(b.notifications.length).toBe(a.notifications.length);
  });
  it("an empty world advances without effects", () => {
    const e = emptyWorld(1, SEED_NOW);
    expect(Object.keys(advanceTo(e, SEED_NOW + 3 * DAY).settlements)).toHaveLength(0);
  });
  it("a payment is settled once at the next midnight, never twice", () => {
    const a = createLoan(base(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 150, idempotencyKey: "k" });
    const w1 = advanceTo(a.world, SEED_NOW + DAY);
    const w2 = advanceTo(w1, SEED_NOW + 2 * DAY);
    const owing = Object.values(w2.settlements).filter((s) => s.loanIds.includes(a.loan.id));
    expect(owing).toHaveLength(1);
  });
});
