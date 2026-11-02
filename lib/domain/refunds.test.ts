import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { buildSeedWorld } from "../demo/seed";
import { SEED_NOW } from "../demo/constants";
import { createMockNbfc } from "../api/nbfc-port";
import { applySettlementResult, markProcessing, retrySettlement, submitInstructions, toInstruction } from "../settlement";
import { linesCsv, reportJson, summaryCsv, csvCell } from "../settlement-report";
import { reconcileDay, settlementDates, settlementIssues, stuckPayments } from "../reconcile";
import { amountDue, awaitingSettlement } from "./selectors";
import { DAY } from "./time";
import { DomainError, advanceTo, createLoan, repayLoan } from "./world";
import { decideRefund, refundPayment } from "./refunds";
import { produce } from "immer";
import type { WorldState } from "./types";

const SEEDED = buildSeedWorld();
/** Coins already received today by a stall in the seed, which will join tonight's batch. */
const base = (vendor: string) => awaitingSettlement(SEEDED, vendor);
const pay = (w: WorldState, coins: number, key: string, student = "stu-aarav", vendor = "ven-gupta-chai") => createLoan(w, { studentId: student, vendorId: vendor, coins, idempotencyKey: key });

/** Runs the lender for everything scheduled, the way the store does. */
async function settle(w: WorldState, scenario: "paid" | "failed" | "on_hold" = "paid"): Promise<WorldState> {
  const scheduled = Object.values(w.settlements).filter((s) => s.status === "scheduled");
  const results = await submitInstructions(scheduled.map(toInstruction), createMockNbfc({ scenario: () => scenario }));
  return produce(w, (d) => {
    for (const s of scheduled) markProcessing(d, s.id, d.clock.now);
    for (const r of results) applySettlementResult(d, r.id, r.result, d.clock.now);
  });
}

describe("seed reconciliation", () => {
  it("every seeded business day reconciles with no issues", () => {
    for (const date of settlementDates(SEEDED)) {
      const r = reconcileDay(SEEDED, date);
      expect(r.issues, date).toEqual([]);
      expect(r.paid, date).toBe(r.instructed);
    }
    expect(stuckPayments(SEEDED)).toEqual([]);
  });
});

describe("midnight job", () => {
  it("settles a day's payments once and the vendor total is the sum of them", async () => {
    let w = pay(SEEDED, 40, "a").world;
    w = pay(w, 60, "b", "stu-diya").world;
    w = advanceTo(w, SEED_NOW + DAY);
    const s = Object.values(w.settlements).filter((x) => x.vendorId === "ven-gupta-chai").sort((a, b) => b.date.localeCompare(a.date))[0];
    expect(s.totalAmount).toBe(base("ven-gupta-chai") + 100);
    expect(s.status).toBe("scheduled");
    w = await settle(w);
    expect(w.settlements[s.id].status).toBe("paid");
    expect(w.settlements[s.id].reference).toMatch(/^UTR/);
    expect(s.loanIds.every((id) => w.loans[id].vendorStatus === "settled")).toBe(true);
  });
  it("a failed or held settlement leaves payments awaiting; retry then pays it", async () => {
    let w = advanceTo(pay(SEEDED, 40, "a").world, SEED_NOW + DAY);
    const id = Object.keys(w.settlements).find((k) => w.settlements[k].loanIds.some((l) => w.loans[l].idempotencyKey === "a"))!;
    w = await settle(w, "failed");
    expect(w.settlements[id].status).toBe("failed");
    expect(w.settlements[id].failureReason).toBeTruthy();
    expect(w.loans[w.settlements[id].loanIds[0]].vendorStatus).toBe("received");
    w = produce(w, (d) => void retrySettlement(d, id, d.clock.now, "ops:admin"));
    w = await settle(w, "paid");
    expect(w.settlements[id].status).toBe("paid");
    expect(reconcileDay(w, w.settlements[id].date).issues).toEqual([]);
  });
  it("tells the vendor the result", async () => {
    let w = advanceTo(pay(SEEDED, 40, "a").world, SEED_NOW + DAY);
    w = await settle(w, "paid");
    const acct = w.vendors["ven-gupta-chai"].accountId;
    expect(w.notifications.some((n) => n.accountId === acct && n.kind === "settlement" && n.title === "Settlement paid")).toBe(true);
  });

  it("property: the sum of settled payments equals the sum of the instructions", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.tuple(fc.constantFrom("ven-gupta-chai", "ven-print-hub", "ven-quickwash"), fc.integer({ min: 5, max: 90 })), { minLength: 1, maxLength: 8 }), async (items) => {
        let w = SEEDED;
        items.forEach(([vendor, coins], i) => {
          w = pay(w, coins, `p${i}`, "stu-diya", vendor).world;
        });
        w = await settle(advanceTo(w, SEED_NOW + DAY));
        const instructed = Object.values(w.settlements).filter((s) => s.date === "2026-10-30").reduce((a, s) => a + s.totalAmount, 0);
        const payments = items.reduce((a, [, c]) => a + c, 0);
        const day = reconcileDay(w, "2026-10-30");
        expect(day.instructed).toBe(instructed);
        expect(day.issues).toEqual([]);
        // the new batch is exactly the new payments
        const alreadyReceived = Object.keys(SEEDED.vendors).reduce((a, v) => a + base(v), 0);
        expect(instructed).toBe(alreadyReceived + payments);
      }),
      { numRuns: 15 },
    );
  });
});

describe("refunds", () => {
  it("before settlement, the payment drops out of that night's total and the student stops owing", () => {
    let w = pay(SEEDED, 40, "a").world;
    w = pay(w, 60, "b", "stu-diya").world;
    const first = Object.values(w.loans).find((l) => l.idempotencyKey === "a")!;
    const r = refundPayment(w, { loanId: first.id, vendorId: first.vendorId, reason: "Wrong order", actor: "ven-gupta-chai" });
    expect(r.refund.mode).toBe("pre_settlement");
    expect(amountDue(r.world.loans[first.id])).toBe(0);
    const after = advanceTo(r.world, SEED_NOW + DAY);
    const s = Object.values(after.settlements).filter((x) => x.vendorId === "ven-gupta-chai").sort((a, b) => b.date.localeCompare(a.date))[0];
    expect(s.totalAmount).toBe(base("ven-gupta-chai") + 60);
    expect(r.world.notifications.some((n) => n.title === "A payment was refunded")).toBe(true);
  });
  it("after settlement, it becomes a negative adjustment netted into the next batch", async () => {
    let w = pay(SEEDED, 40, "a").world;
    w = await settle(advanceTo(w, SEED_NOW + DAY));
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "a")!;
    const r = refundPayment(w, { loanId: loan.id, vendorId: loan.vendorId, reason: "Cancelled", actor: "ven-gupta-chai" });
    expect(r.refund.mode).toBe("post_settlement");
    expect(r.world.adjustments.at(-1)).toMatchObject({ coins: -40, loanId: loan.id });
    // next night: a 100 coin payment is reduced by the 40 adjustment
    let n = pay(r.world, 100, "next", "stu-diya").world;
    n = advanceTo(n, SEED_NOW + 2 * DAY);
    const s = Object.values(n.settlements).filter((x) => x.vendorId === "ven-gupta-chai" && x.date === "2026-10-31")[0];
    expect(s.adjustmentCoins).toBe(-40);
    expect(s.totalAmount).toBe(60);
    expect(reconcileDay(n, s.date).issues).toEqual([]);
  });
  it("an adjustment larger than the next batch carries to a later night rather than going negative", () => {
    let w = pay(SEEDED, 200, "a").world;
    w = advanceTo(w, SEED_NOW + DAY);
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "a")!;
    w = refundPayment(w, { loanId: loan.id, vendorId: loan.vendorId, reason: "Cancelled", actor: "v" }).world;
    w = pay(w, 50, "small", "stu-diya").world;
    w = advanceTo(w, SEED_NOW + 2 * DAY);
    const s = Object.values(w.settlements).find((x) => x.date === "2026-10-31" && x.vendorId === "ven-gupta-chai")!;
    expect(s.totalAmount).toBe(50);
    expect(s.adjustmentCoins).toBe(0);
    expect(w.adjustments.at(-1)?.settlementId).toBeUndefined();
  });
  it("is idempotent per payment, and refuses a payment already being repaid", () => {
    const w = pay(SEEDED, 40, "a").world;
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "a")!;
    const a = refundPayment(w, { loanId: loan.id, vendorId: loan.vendorId, reason: "x", actor: "v" });
    const b = refundPayment(a.world, { loanId: loan.id, vendorId: loan.vendorId, reason: "x", actor: "v" });
    expect(b.duplicate).toBe(true);
    expect(b.world.refunds).toHaveLength(1);
    const started = repayLoan(w, { loanId: loan.id, amount: 10 }).world;
    expect(() => refundPayment(started, { loanId: loan.id, vendorId: loan.vendorId, reason: "x", actor: "v" })).toThrow(DomainError);
  });
  it("needs a reason, and only the stall's own payments", () => {
    const w = pay(SEEDED, 40, "a").world;
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "a")!;
    expect(() => refundPayment(w, { loanId: loan.id, vendorId: loan.vendorId, reason: " ", actor: "v" })).toThrow(/reason/i);
    expect(() => refundPayment(w, { loanId: loan.id, vendorId: "ven-print-hub", reason: "x", actor: "v" })).toThrow(DomainError);
  });
  it("caps refunds per vendor per 7 days", () => {
    let w = SEEDED;
    for (let i = 0; i < 6; i++) w = pay(w, 20, `c${i}`, i % 2 ? "stu-diya" : "stu-rohan").world;
    const loans = Object.values(w.loans).filter((l) => l.idempotencyKey.startsWith("c"));
    for (let i = 0; i < 5; i++) w = refundPayment(w, { loanId: loans[i].id, vendorId: loans[i].vendorId, reason: "x", actor: "v" }).world;
    expect(() => refundPayment(w, { loanId: loans[5].id, vendorId: loans[5].vendorId, reason: "x", actor: "v" })).toThrow(/7 days/);
  });
  it("a large refund waits for ops, who can approve or decline it", () => {
    const w = pay(SEEDED, 800, "big", "stu-sana", "ven-gupta-chai").world;
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "big")!;
    const r = refundPayment(w, { loanId: loan.id, vendorId: loan.vendorId, reason: "Cancelled order", actor: "v" });
    expect(r.refund.status).toBe("pending_ops");
    expect(r.world.loans[loan.id].status).not.toBe("refunded");
    expect(() => decideRefund(r.world, r.refund.id, false, "ops:admin")).toThrow(/reason/i);
    const declined = decideRefund(r.world, r.refund.id, false, "ops:admin", "Order was collected");
    expect(declined.refunds[0].status).toBe("declined");
    const approved = decideRefund(r.world, r.refund.id, true, "ops:admin");
    expect(approved.loans[loan.id].status).toBe("refunded");
    expect(approved.refunds[0]).toMatchObject({ status: "done", decidedBy: "ops:admin" });
    expect(() => decideRefund(approved, r.refund.id, true, "ops:admin")).toThrow(DomainError);
  });
});

describe("reconciliation catches tampering", () => {
  it("flags a total that does not match the ledger", async () => {
    let w = advanceTo(pay(SEEDED, 40, "a").world, SEED_NOW + DAY);
    w = await settle(w);
    const id = Object.keys(w.settlements).find((k) => w.settlements[k].loanIds.some((l) => w.loans[l].idempotencyKey === "a"))!;
    const bad = produce(w, (d) => void (d.settlements[id].totalAmount += 7));
    const day = reconcileDay(bad, w.settlements[id].date);
    expect(day.mismatch).toBe(true);
    expect(settlementIssues(bad, bad.settlements[id]).join(" ")).toMatch(/total/);
  });
  it("flags a paid settlement with no reference and a payment missing from every settlement", async () => {
    let w = advanceTo(pay(SEEDED, 40, "a").world, SEED_NOW + DAY);
    w = await settle(w);
    const id = Object.keys(w.settlements).find((k) => w.settlements[k].loanIds.some((l) => w.loans[l].idempotencyKey === "a"))!;
    const noRef = produce(w, (d) => void (d.settlements[id].reference = undefined));
    expect(reconcileDay(noRef, w.settlements[id].date).issues.join(" ")).toMatch(/no bank reference/);
    const dropped = produce(w, (d) => {
      const s = d.settlements[id];
      const lid = s.loanIds[0];
      s.loanIds = s.loanIds.slice(1);
      s.grossCoins -= d.loans[lid].coins;
      s.totalAmount -= d.loans[lid].coins;
      delete d.loans[lid].settlementId;
    });
    expect(reconcileDay(dropped, w.settlements[id].date).issues.join(" ")).toMatch(/in no settlement/);
  });
});

describe("settlement report", () => {
  it("JSON carries the instruction fields and a simulated marker; CSV has a header and one line per payment", async () => {
    let w = pay(SEEDED, 40, "a").world;
    w = pay(w, 60, "b", "stu-diya").world;
    w = await settle(advanceTo(w, SEED_NOW + DAY));
    const list = Object.values(w.settlements).filter((s) => s.date === "2026-10-30" && s.vendorId === "ven-gupta-chai");
    const json = JSON.parse(reportJson(w, list));
    expect(json.simulated).toBe(true);
    expect(json.settlements[0]).toMatchObject({ settlementId: list[0].id, amountRupees: list[0].totalAmount, status: "paid" });
    const lines = linesCsv(w, list).trim().split("\n");
    expect(lines[0]).toContain("settlement_id");
    expect(lines.length - 1).toBe(list[0].count);
    expect(summaryCsv(w, list).trim().split("\n")).toHaveLength(2);
  });
  it("defuses spreadsheet formulas and quotes commas", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell(-40)).toBe("-40");
  });
});
