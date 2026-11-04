import { describe, expect, it } from "vitest";
import { createMockNbfc } from "./api/nbfc-port";
import { buildSeedWorld } from "./demo/seed";
import { SEED_NOW } from "./demo/constants";
import { DAY } from "./domain/time";
import { createLoan, advanceTo } from "./domain/world";
import { produce } from "immer";
import { applySettlementResult, retrySettlement, submitInstructions, toInstruction } from "./settlement";
import type { WorldState } from "./domain/types";

function withSettlement(): { w: WorldState; id: string } {
  const a = createLoan(buildSeedWorld(), { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 150, idempotencyKey: "k" });
  const w = advanceTo(a.world, SEED_NOW + DAY);
  const s = Object.values(w.settlements).find((x) => x.loanIds.includes(a.loan.id))!;
  return { w, id: s.id };
}

describe("settlement", () => {
  it("a settlement id is vendor plus payment", () => {
    const { id } = withSettlement();
    expect(id).toMatch(/^SET-ven-gupta-chai-L-\d+$/);
  });
  it("totals the vendor's payments and starts as scheduled", () => {
    const { w, id } = withSettlement();
    const s = w.settlements[id];
    expect(s.status).toBe("scheduled");
    expect(s.totalAmount).toBe(s.grossCoins - s.refundCoins + s.adjustmentCoins);
  });
  it("only a paid answer moves payments to settled; failure leaves them awaiting", async () => {
    const { w, id } = withSettlement();
    const failed = produce(w, (d) => void applySettlementResult(d, id, { status: "failed", failureReason: "x" }, w.clock.now));
    expect(failed.settlements[id].loanIds.every((l) => failed.loans[l].vendorStatus === "received")).toBe(true);
    const retried = produce(failed, (d) => void retrySettlement(d, id, w.clock.now, "ops"));
    expect(retried.settlements[id].status).toBe("scheduled");
    const [r] = await submitInstructions([toInstruction(retried.settlements[id])], createMockNbfc());
    const paid = produce(retried, (d) => void applySettlementResult(d, id, r.result, w.clock.now));
    expect(paid.settlements[id].status).toBe("paid");
    expect(paid.settlements[id].reference).toMatch(/^UTR\d{10}$/);
    expect(paid.settlements[id].loanIds.every((l) => paid.loans[l].vendorStatus === "settled")).toBe(true);
  });
  it("paid is final and re-applying changes nothing", () => {
    const { w, id } = withSettlement();
    const once = produce(w, (d) => void applySettlementResult(d, id, { status: "paid", reference: "UTR0000000001" }, w.clock.now));
    const twice = produce(once, (d) => void applySettlementResult(d, id, { status: "failed", failureReason: "late" }, w.clock.now));
    expect(twice.settlements[id].status).toBe("paid");
  });
});

describe("money boundary", () => {
  it("the lender port can only report settlements and read repayment status", () => {
    expect(Object.keys(createMockNbfc()).sort()).toEqual(["getRepaymentStatus", "submitSettlement"]);
  });
  it("the settlement instruction carries a masked account and no money-moving fields", () => {
    const { w, id } = withSettlement();
    const i = toInstruction(w.settlements[id]);
    expect(Object.keys(i).sort()).toEqual(["amountRupees", "bankMasked", "date", "paymentCount", "paymentIds", "settlementId", "vendorId"]);
    expect(i.bankMasked).toMatch(/[•*]/);
  });
});
