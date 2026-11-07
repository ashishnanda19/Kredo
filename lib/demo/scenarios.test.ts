import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { createMockNbfc, type NbfcScenario } from "../api/nbfc-port";
import { applySettlementResult, markProcessing, submitInstructions, toInstruction } from "../settlement";
import { advanceTo } from "../domain/world";
import { amountDue, availableLimit, blockedReason, loansOfStudent, studentState } from "../domain/selectors";
import { reconcileDay, settlementDates } from "../reconcile";
import { buildSeedWorld } from "./seed";
import { SCENARIOS, type ScenarioCtx } from "./scenarios";
import type { WorldState } from "../domain/types";

const SEEDED = buildSeedWorld();

/** A scenario context with no screen: a world in memory and the mock lender. */
function memoryCtx(start: WorldState = SEEDED) {
  let world = start;
  let lender: NbfcScenario = "paid";
  const shown: { student?: string; vendor?: string; studentPath?: string; vendorPath?: string } = {};
  const ctx: ScenarioCtx = {
    world: () => world,
    update: (fn) => void (world = fn(world)),
    setLender: (a) => void (lender = a),
    async advanceTo(ms, label) {
      world = advanceTo(world, ms, label);
      const scheduled = Object.values(world.settlements).filter((s) => s.status === "scheduled");
      const results = await submitInstructions(scheduled.map(toInstruction), createMockNbfc({ scenario: () => lender }));
      world = produce(world, (d) => {
        for (const s of scheduled) markProcessing(d, s.id, d.clock.now);
        for (const r of results) applySettlementResult(d, r.id, r.result, d.clock.now);
      });
    },
    student: (id, path) => void Object.assign(shown, { student: id, studentPath: path }),
    vendor: (id, path) => void Object.assign(shown, { vendor: id, vendorPath: path }),
    ops: () => {},
    memo: {},
  };
  return { ctx, shown, get world() { return world; } };
}

async function play(n: number, start?: WorldState) {
  const sc = SCENARIOS.find((s) => s.n === n)!;
  const h = memoryCtx(start);
  const details: string[] = [];
  for (const step of sc.steps) details.push(String((await step.run(h.ctx)) ?? ""));
  return { h, details, sc };
}

describe("the 11 scenarios", () => {
  it("are numbered 1 to 11 in order, each with captions on every step", () => {
    expect(SCENARIOS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const s of SCENARIOS) for (const st of s.steps) expect(st.caption.length).toBeGreaterThan(10);
  });

  it("1. onboarding: a new stall is accepted with a QR and a new student starts at the first limit", async () => {
    const { h } = await play(1);
    const vendor = h.world.vendors[h.ctx.memo.vendorId];
    expect(vendor.status).toBe("accepted");
    expect(vendor.bankVerified).toBe(true);
    expect(studentState(h.world, "stu-aarav")).toMatchObject({ aura: 50, limit: 1000 });
    expect(h.shown.vendorPath).toBe("/vendor/qr");
  });
  it("1 can be played twice: the second stall gets its own name", async () => {
    const first = await play(1);
    const second = await play(1, first.h.world);
    expect(new Set(Object.values(second.h.world.vendors).map((v) => v.stallName)).size).toBe(Object.keys(second.h.world.vendors).length);
  });

  it("2. happy path: one loan with the fee and a due date, and the stall sees it", async () => {
    const { h, details } = await play(2);
    const loans = loansOfStudent(h.world, "stu-aarav");
    expect(loans).toHaveLength(1);
    expect(loans[0]).toMatchObject({ coins: 40, fee: 5, vendorId: "ven-gupta-chai", vendorStatus: "received" });
    expect(details[1]).toMatch(/fee ₹5/);
    expect(availableLimit(h.world, "stu-aarav")).toBe(960);
  });

  it("3. midnight: the batch is paid by the lender with a reference, and the day reconciles", async () => {
    const { h } = await play(3);
    const s = Object.values(h.world.settlements).filter((x) => x.vendorId === "ven-gupta-chai").sort((a, b) => b.date.localeCompare(a.date))[0];
    expect(s.status).toBe("paid");
    expect(s.reference).toMatch(/^UTR/);
    expect(reconcileDay(h.world, s.date).issues).toEqual([]);
  });

  it("4. repay on time: Aarav's Aura goes 50 to 53 with a streak of 1", async () => {
    const { h } = await play(4);
    expect(studentState(h.world, "stu-aarav")).toMatchObject({ aura: 53, consecutiveOnTime: 1 });
    expect(Object.values(h.world.loans).find((l) => l.studentId === "stu-aarav")?.status).toBe("paid");
  });

  it("5. late payer: Meera repays 6 days late and her Aura drops by 4, with a reason", async () => {
    const { h, details } = await play(5);
    // the repayment itself is -4; the jump also let an old event age past 90 days (it then counts for half), and the script says so
    expect(details[1]).toMatch(/Aura moved 58 to 56 on its own/);
    expect(details[2]).toMatch(/Aura 56 to 52\. -4: Repaid 6 days after the due date/);
    expect(studentState(h.world, "stu-meera").aura).toBe(52);
    expect(blockedReason(h.world, "stu-meera")).toBeNull();
  });

  it("6. default and block: Ishita starts blocked at Aura 15 and ends able to spend again", async () => {
    expect(studentState(SEEDED, "stu-ishita").aura).toBe(15);
    expect(blockedReason(SEEDED, "stu-ishita")).not.toBeNull();
    const { h } = await play(6);
    expect(blockedReason(h.world, "stu-ishita")).toBeNull();
    expect(studentState(h.world, "stu-ishita").aura).toBeGreaterThanOrEqual(20);
  });

  it("7. prior default cap: 800 is declined with PRIOR_DEFAULT_CAP and 300 goes through", async () => {
    const { h, details } = await play(7);
    expect(details[1]).toContain("PRIOR_DEFAULT_CAP");
    expect(loansOfStudent(h.world, "stu-kabir").some((l) => l.coins === 300 && l.idempotencyKey.startsWith("sc-cap"))).toBe(true);
  });

  it("8. limit growth: Rohan's limit goes from 5,000 to 7,500 and he is told", async () => {
    expect(studentState(SEEDED, "stu-rohan").limit).toBe(5000);
    const { h, details } = await play(8);
    expect(studentState(h.world, "stu-rohan").limit).toBe(7500);
    expect(details[2]).toContain("5000 to 7500");
  });

  it("9. fraud catch: self-pay is blocked and flagged; the suspended stall's QR is refused", async () => {
    const { h, details } = await play(9);
    expect(details[0]).toContain("SELF_PAY");
    expect(details[1]).toContain("This stall isn't active right now.");
    expect(h.world.flags).toHaveLength(1);
    expect(Object.values(h.world.loans).filter((l) => l.vendorId === "ven-stationery" && l.studentId === "stu-vikram" && l.createdAt >= SEEDED.clock.now)).toHaveLength(0);
  });

  it("10. idempotent retry: exactly one loan after the retry", async () => {
    const { h, details } = await play(10);
    expect(loansOfStudent(h.world, "stu-aarav")).toHaveLength(1);
    expect(details[1]).toContain("Same coin spend returned");
  });

  it("11. refund: pre-settlement drops out of the batch; post-settlement is netted into the next", async () => {
    const { h } = await play(11);
    const batches = Object.values(h.world.settlements).filter((s) => s.vendorId === "ven-print-hub").sort((a, b) => a.date.localeCompare(b.date));
    const [first, second] = batches.slice(-2);
    expect(first.loanIds.some((id) => h.world.loans[id].idempotencyKey.startsWith("sc-refund-a"))).toBe(false);
    expect(second.adjustmentCoins).toBe(-120);
    expect(second.totalAmount).toBe(200 - 120);
    for (const d of settlementDates(h.world).slice(0, 3)) expect(reconcileDay(h.world, d).issues).toEqual([]);
  });

  it("every scenario, played from a fresh demo in order, ends with money-free reconciliation and no leftover overdue for Aarav", async () => {
    for (const sc of SCENARIOS) {
      const { h } = await play(sc.n, buildSeedWorld());
      for (const d of settlementDates(h.world).slice(0, 2)) expect(reconcileDay(h.world, d).issues, `${sc.n} ${d}`).toEqual([]);
      for (const l of Object.values(h.world.loans)) expect(amountDue(l)).toBeGreaterThanOrEqual(0);
    }
  });
});
