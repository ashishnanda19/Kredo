import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { buildSeedWorld } from "../demo/seed";
import { qrPayload } from "../qr";
import { availableLimit } from "./selectors";
import { checkGate, payByQr, precheckPay, quote, selfPayLink } from "./pay";
import { IdempotencyConflict } from "./world";
import { HOUR } from "./time";

const W = buildSeedWorld();
const QR = (v: string) => qrPayload(v, W.vendors[v].qrVersion);
const pay = (studentId: string, vendorId: string, coins: number, key = "k") => payByQr(W, { studentId, qr: QR(vendorId), coins, idempotencyKey: key });

describe("pay gates", () => {
  it("lets a verified student with limit pay an active stall, and shows the costs", () => {
    const r = pay("stu-aarav", "ven-gupta-chai", 40);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.loan.fee).toBe(5);
    expect(r.loan.totalRepayable).toBe(r.loan.coins + r.loan.fee + r.loan.interest);
    expect(r.world.loans[r.loan.id].vendorStatus).toBe("received");
    const q = quote(W, "stu-aarav", 40);
    expect(q.total).toBe(r.loan.totalRepayable);
    expect(q.limitAfter).toBe(availableLimit(W, "stu-aarav") - 40);
  });
  it("blocks on low Aura before it looks at the amount (gate order)", () => {
    expect(checkGate(W, "stu-ishita", "ven-gupta-chai", 9999)).toMatchObject({ ok: false, code: "LOW_AURA" });
  });
  it("blocks while a loan is past its due date", () => {
    expect(checkGate(W, "stu-meera", "ven-gupta-chai", 50)).toMatchObject({ ok: false, code: "PAST_DUE" });
  });
  it("declines an amount over the available limit with the amount in the message", () => {
    const r = checkGate(W, "stu-aarav", "ven-gupta-chai", 1500);
    expect(r).toMatchObject({ ok: false, code: "OVER_LIMIT" });
  });
  it("after a default, a request above the cap is declined (never silently reduced), and one under it is allowed", () => {
    expect(checkGate(W, "stu-kabir", "ven-gupta-chai", 800)).toMatchObject({ ok: false, code: "PRIOR_DEFAULT_CAP" });
    expect(checkGate(W, "stu-kabir", "ven-gupta-chai", 300).ok).toBe(true);
  });
  it("rejects a suspended or unverified stall's QR", () => {
    expect(precheckPay(W, { studentId: "stu-aarav", qr: QR("ven-night-canteen"), coins: 40 })).toMatchObject({ ok: false, code: "INACTIVE", message: "This stall isn't active right now." });
    expect(precheckPay(W, { studentId: "stu-aarav", qr: QR("ven-juice"), coins: 40 })).toMatchObject({ ok: false, code: "INACTIVE" });
  });
  it("refuses forged, revoked and foreign QR codes before any gate", () => {
    expect(precheckPay(W, { studentId: "stu-aarav", qr: "hello", coins: 40 })).toMatchObject({ code: "MALFORMED" });
    expect(precheckPay(W, { studentId: "stu-aarav", qr: qrPayload("ven-gupta-chai", 9), coins: 40 })).toMatchObject({ code: "REVOKED" });
  });
  it("a student cannot pay their own stall, and the attempt leaves one flag", () => {
    expect(selfPayLink(W, "stu-vikram", "ven-stationery")).toBe("device");
    const a = precheckPay(W, { studentId: "stu-vikram", qr: QR("ven-stationery"), coins: 50 });
    expect(a).toMatchObject({ ok: false, code: "SELF_PAY" });
    expect(a.world.flags).toHaveLength(1);
    expect(a.world.flags[0]).toMatchObject({ kind: "SELF_PAY", studentId: "stu-vikram", vendorId: "ven-stationery", status: "open" });
    const b = precheckPay(a.world, { studentId: "stu-vikram", qr: QR("ven-stationery"), coins: 60 });
    expect(b.world.flags).toHaveLength(1); // the same attempt on the same day is not flagged twice
    expect(a.world.audit.at(-1)?.action).toBe("fraud.flagged");
  });
  it("a student and an unrelated stall are not linked", () => {
    expect(selfPayLink(W, "stu-diya", "ven-gupta-chai")).toBeNull();
  });
  it("limits how fast one student can pay, and flags it", () => {
    let w = W;
    for (let i = 0; i < 5; i++) {
      const r = payByQr(w, { studentId: "stu-rohan", qr: QR("ven-gupta-chai"), coins: 20, idempotencyKey: `v${i}` });
      expect(r.ok).toBe(true);
      w = r.world;
    }
    const sixth = payByQr(w, { studentId: "stu-rohan", qr: QR("ven-gupta-chai"), coins: 20, idempotencyKey: "v5" });
    expect(sixth).toMatchObject({ ok: false, code: "VELOCITY_STUDENT" });
    expect(sixth.world.flags.some((f) => f.kind === "VELOCITY_STUDENT")).toBe(true);
    // an hour later it is fine again
    const later = { ...sixth.world, clock: { ...sixth.world.clock, now: sixth.world.clock.now + HOUR + 1 } };
    expect(payByQr(later, { studentId: "stu-rohan", qr: QR("ven-gupta-chai"), coins: 20, idempotencyKey: "v5" }).ok).toBe(true);
  });
});

describe("idempotent submit", () => {
  it("the same key returns the same loan even after the limit is used up", () => {
    const avail = availableLimit(W, "stu-aarav");
    const first = payByQr(W, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: avail, idempotencyKey: "same" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(availableLimit(first.world, "stu-aarav")).toBe(0);
    const again = payByQr(first.world, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: avail, idempotencyKey: "same" });
    expect(again).toMatchObject({ ok: true, duplicate: true });
    if (again.ok) expect(again.loan.id).toBe(first.loan.id);
    expect(Object.keys(again.world.loans)).toHaveLength(Object.keys(first.world.loans).length);
  });
  it("the same key with a different amount is a conflict, not a second loan", () => {
    const first = payByQr(W, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: 40, idempotencyKey: "k1" });
    expect(() => payByQr(first.world, { studentId: "stu-aarav", qr: QR("ven-gupta-chai"), coins: 41, idempotencyKey: "k1" })).toThrow(IdempotencyConflict);
  });
  it("property: retrying any number of times creates exactly one loan", () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 400 }), fc.integer({ min: 1, max: 6 }), (coins, retries) => {
        let w = W;
        const ids = new Set<string>();
        for (let i = 0; i < retries; i++) {
          const r = payByQr(w, { studentId: "stu-diya", qr: QR("ven-print-hub"), coins, idempotencyKey: "retry" });
          expect(r.ok).toBe(true);
          if (r.ok) {
            w = r.world;
            ids.add(r.loan.id);
          }
        }
        expect(ids.size).toBe(1);
        expect(Object.values(w.loans).filter((l) => l.idempotencyKey === "retry")).toHaveLength(1);
      }),
      { numRuns: 25 },
    );
  });
  it("property: no accepted payment ever exceeds the available limit", () => {
    fc.assert(
      fc.property(fc.constantFrom("stu-aarav", "stu-diya", "stu-rohan", "stu-kabir", "stu-sana"), fc.integer({ min: 1, max: 6000 }), (id, coins) => {
        const avail = availableLimit(W, id);
        const r = payByQr(W, { studentId: id, qr: QR("ven-quickwash"), coins, idempotencyKey: `p-${id}-${coins}` });
        if (r.ok) expect(coins).toBeLessThanOrEqual(avail);
      }),
      { numRuns: 60 },
    );
  });
});
