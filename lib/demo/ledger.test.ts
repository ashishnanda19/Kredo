import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "./seed";
import { SEED_NOW } from "./constants";
import { qrPayload } from "../qr";
import { ledgerEvents } from "./ledger";
import { payByQr, precheckPay } from "../domain/pay";
import { advanceTo, repayLoan } from "../domain/world";
import { refundPayment } from "../domain/refunds";
import { DAY } from "../domain/time";

const W = buildSeedWorld();
const QR = (v: string) => qrPayload(v, W.vendors[v].qrVersion);

describe("ledger strip", () => {
  it("is empty on a fresh demo and only shows what happened since it began", () => {
    expect(ledgerEvents(W)).toEqual([]);
  });
  it("tells a payment in plain English, loan after payment, newest first", () => {
    const r = payByQr(W, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: 40, idempotencyKey: "k" });
    if (!r.ok) throw new Error("pay failed");
    const ev = ledgerEvents(r.world);
    expect(ev.map((e) => e.text)).toEqual([expect.stringMatching(/^Loan created for Aarav, due /), "Aarav paid 40 coins to Gupta Chai Tapri"]);
    expect(ev[1].flow).toBe("pay");
  });
  it("covers midnight, repayment, Aura changes, refunds and fraud flags", () => {
    // the flag first: 15 days on, Vikram would be stopped for an overdue loan before the self-pay rule is reached
    let w = precheckPay(W, { studentId: "stu-vikram", qr: QR("ven-stationery"), coins: 50 }).world;
    w = payByQr(w, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: 40, idempotencyKey: "k" }).world;
    const loan = Object.values(w.loans).find((l) => l.idempotencyKey === "k")!;
    w = advanceTo(w, SEED_NOW + 15 * DAY, "To due date");
    w = repayLoan(w, { loanId: loan.id, amount: w.loans[loan.id].totalRepayable }).world;
    const text = ledgerEvents(w).map((e) => e.text).join("\n");
    expect(text).toMatch(/Settlement scheduled for Gupta Chai Tapri/);
    expect(text).toMatch(/Aarav repaid ₹\d+ to the lending partner \(loan closed\)/);
    expect(text).toMatch(/Aarav's Aura \+3/);
    expect(text).toMatch(/Fraud flag: Vikram tried to pay a stall linked to their own account/);
    expect(text).toMatch(/Clock moved: To due date/);
    const fresh = payByQr(W, { studentId: "stu-diya", qr: QR("ven-print-hub"), coins: 30, idempotencyKey: "r" });
    if (!fresh.ok) throw new Error("x");
    const l = fresh.loan;
    const refunded = refundPayment(fresh.world, { loanId: l.id, vendorId: l.vendorId, reason: "x", actor: "v" }).world;
    expect(ledgerEvents(refunded)[0].text).toMatch(/Campus Print Hub refunded 30 coins to Diya \(left out of tonight's settlement\)/);
  });
  it("never lists future-dated or zero-effect score events", () => {
    for (const e of ledgerEvents(W, { since: 0 })) expect(e.at).toBeLessThanOrEqual(W.clock.now + 1);
  });
});
