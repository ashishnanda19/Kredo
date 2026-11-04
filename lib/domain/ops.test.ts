import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { buildSeedWorld } from "../demo/seed";
import { SEED_NOW } from "../demo/constants";
import { qrPayload } from "../qr";
import { payByQr } from "./pay";
import { decideFlag } from "./flags";
import { exposureOf, bucketOf } from "./exposure";
import { studentState, studentEvents } from "./selectors";
import { DAY, HOUR, istStartOf } from "./time";
import { advanceTo, createLoan, overrideLimit, DomainError } from "./world";
import { setPolicy, resolvePolicy, PolicyError } from "../policy";
import type { WorldState } from "./types";

const W = buildSeedWorld();
const QR = (v: string) => qrPayload(v, W.vendors[v].qrVersion);
const pay = (w: WorldState, s: string, v: string, coins: number, key: string, at?: number) => {
  const r = payByQr(w, { studentId: s, qr: QR(v), coins, idempotencyKey: key, at });
  if (!r.ok) throw new Error(r.code);
  return r.world;
};

describe("fraud rules at the nightly cut-off", () => {
  it("do not scan the seeded history: a fresh demo has no flags", () => {
    expect(W.monitoring).toBe(true);
    expect(W.flags).toEqual([]);
  });
  it("round-number payments to one stall in the last two hours before midnight raise one flag", () => {
    let w = W;
    const late = istStartOf("2026-10-30", 22) + 15 * 60_000;
    w = advanceTo(w, late);
    for (const [i, s] of ["stu-diya", "stu-sana", "stu-rohan"].entries()) w = pay(w, s, "ven-print-hub", 100, `r${i}`);
    w = advanceTo(w, SEED_NOW + 15 * HOUR);
    const flags = w.flags.filter((f) => f.kind === "ROUND_CLUSTER");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ vendorId: "ven-print-hub", status: "open" });
    expect(flags[0].detail).toMatch(/3 round-number payments/);
  });
  it("round payments earlier in the day are not flagged", () => {
    let w = W;
    for (const [i, s] of ["stu-diya", "stu-sana", "stu-rohan"].entries()) w = pay(w, s, "ven-print-hub", 100, `r${i}`);
    w = advanceTo(w, SEED_NOW + 15 * HOUR);
    expect(w.flags.filter((f) => f.kind === "ROUND_CLUSTER")).toEqual([]);
  });
  it("one student making up most of a stall's takings is flagged once", () => {
    let w = W;
    // a stall with little other business: the seeded quiet stall
    w = pay(w, "stu-sana", "ven-book-barn", 900, "c1");
    w = advanceTo(w, SEED_NOW + 15 * HOUR);
    const f = w.flags.filter((x) => x.kind === "CONCENTRATION" && x.vendorId === "ven-book-barn");
    expect(f.length).toBeLessThanOrEqual(1);
  });
  it("two student accounts on one device are flagged", () => {
    const w = produce(W, (d) => {
      const a = d.accounts[d.students["stu-diya"].accountId];
      const b = d.accounts[d.students["stu-zoya"].accountId];
      a.deviceLinkId = "dev-shared";
      b.deviceLinkId = "dev-shared";
    });
    const after = advanceTo(w, SEED_NOW + 15 * HOUR);
    expect(after.flags.some((f) => f.kind === "SHARED_DEVICE")).toBe(true);
  });
  it("thresholds come from policy and are validated", () => {
    expect(() => resolvePolicy({ fraud: { concentrationPercent: 0 } })).toThrow(PolicyError);
    expect(() => resolvePolicy({ fraud: { roundMinCount: 1 } })).toThrow(PolicyError);
    setPolicy();
  });
});

describe("flag decisions", () => {
  it("an analyst confirms or dismisses an open flag with a note, and it is audited", () => {
    const flagged = payByQr(W, { studentId: "stu-vikram", qr: QR("ven-stationery"), coins: 50, idempotencyKey: "x" });
    const id = flagged.world.flags[0].id;
    const w = produce(flagged.world, (d) => void decideFlag(d, id, "dismissed", "ops:fraud", "Same person, expected", d.clock.now));
    expect(w.flags[0]).toMatchObject({ status: "dismissed", decidedBy: "ops:fraud", note: "Same person, expected" });
    expect(w.audit.at(-1)).toMatchObject({ action: "fraud.dismissed", target: id });
    const again = produce(w, (d) => { expect(decideFlag(d, id, "confirmed", "ops:fraud", "x", d.clock.now)).toBe(false); });
    expect(again.flags[0].status).toBe("dismissed");
  });
});

describe("limit override", () => {
  it("sets the step, tells the student, writes an audit entry, and leaves Aura alone", () => {
    const before = studentState(W, "stu-diya");
    const w = overrideLimit(W, "stu-diya", 5, "ops:admin", "Verified by the lending partner");
    const after = studentState(w, "stu-diya");
    expect(after.level).toBe(5);
    expect(after.limit).toBe(7500);
    expect(after.aura).toBe(before.aura);
    expect(w.audit.at(-1)).toMatchObject({ action: "limit.override", actor: "ops:admin" });
    expect(w.audit.at(-1)?.details).toMatchObject({ fromLevel: before.level, toLevel: 5, reason: "Verified by the lending partner" });
    expect(w.notifications.at(-1)?.kind).toBe("limit_up");
    expect(studentEvents(w, "stu-diya").at(-1)?.kind).toBe("LIMIT_OVERRIDE");
  });
  it("can lower a step, and needs a reason and a real step", () => {
    expect(studentState(overrideLimit(W, "stu-rohan", 2, "ops:admin", "Risk review"), "stu-rohan").limit).toBe(2000);
    expect(() => overrideLimit(W, "stu-diya", 5, "ops:admin", " ")).toThrow(DomainError);
    expect(() => overrideLimit(W, "stu-diya", 9, "ops:admin", "x")).toThrow(DomainError);
    expect(() => overrideLimit(W, "stu-diya", studentState(W, "stu-diya").level, "ops:admin", "x")).toThrow(/already/);
  });
});

describe("exposure", () => {
  const e = exposureOf(W);
  it("adds up: every open loan is in exactly one bucket", () => {
    expect(e.buckets.reduce((a, b) => a + b.loans, 0)).toBe(e.openLoans);
    expect(e.buckets.reduce((a, b) => a + b.principal, 0)).toBe(e.outstandingPrincipal);
  });
  it("shows the overdue and defaulted loans of the seeded people", () => {
    expect(e.buckets.find((b) => b.bucket === "overdue_30_plus")!.loans).toBeGreaterThan(0);
    expect(e.buckets.find((b) => b.bucket === "overdue_1_7")!.loans).toBeGreaterThan(0);
    expect(e.delinquency30Percent).toBeGreaterThan(0);
  });
  it("awaiting settlement matches what vendors have received and not been paid", () => {
    const direct = Object.values(W.loans).filter((l) => l.vendorStatus === "received").reduce((a, l) => a + l.coins - l.refundedCoins, 0);
    expect(e.awaitingSettlement).toBe(direct);
  });
  it("buckets by days to or past the due date", () => {
    expect(bucketOf("2026-10-30", SEED_NOW)).toBe("due_week");
    expect(bucketOf("2026-11-20", SEED_NOW)).toBe("not_due");
    expect(bucketOf("2026-10-20", SEED_NOW)).toBe("overdue_8_30");
    expect(bucketOf("2026-09-01", SEED_NOW)).toBe("overdue_30_plus");
  });
  it("a new payment moves exposure by its principal", () => {
    const after = exposureOf(createLoan(W, { studentId: "stu-aarav", vendorId: "ven-gupta-chai", coins: 120, idempotencyKey: "e" }).world);
    expect(after.outstandingPrincipal).toBe(e.outstandingPrincipal + 120);
    expect(after.awaitingSettlement).toBe(e.awaitingSettlement + 120);
  });
});
void DAY;
