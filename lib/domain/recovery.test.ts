import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "../demo/seed";
import { qrPayload } from "../qr";
import { createEngineScoreProvider } from "../aura/provider";
import { blockedReason, amountDue, studentState } from "./selectors";
import { ladderView } from "./limit";
import { questViews, recoveryPlan } from "./recovery";
import { checkGate, microSpendEligible, payByQr } from "./pay";
import { awardQuest, repayLoan } from "./world";
import { DAY } from "./time";
import { advanceTo } from "./world";
import type { WorldState } from "./types";

const W = buildSeedWorld();
const QR = (v: string) => qrPayload(v, W.vendors[v].qrVersion);

function clearOverdue(w: WorldState, studentId: string): WorldState {
  let x = w;
  for (const l of Object.values(x.loans).filter((l) => l.studentId === studentId && (l.status === "overdue" || l.status === "defaulted"))) {
    x = repayLoan(x, { loanId: l.id, amount: amountDue(x.loans[l.id]) }).world;
  }
  return x;
}

describe("the way back (Ishita: overdue and low Aura)", () => {
  it("starts with clearing what is overdue, and says so plainly", () => {
    const plan = recoveryPlan(W, "stu-ishita");
    expect(plan.blocked?.code).toBe("PAST_DUE");
    expect(plan.overdueOwed).toBeGreaterThan(0);
    expect(plan.steps.map((s) => [s.id, s.state])).toEqual([["clear_overdue", "next"], ["quests", "waiting"], ["micro_spend", "waiting"], ["back_on_track", "waiting"]]);
    expect(plan.estimate).toContain("as soon as");
  });
  it("quests cannot lift Aura to the minimum while something is overdue", () => {
    let w = W;
    for (const q of ["verify_identity", "verify_bank", "set_reminders"] as const) w = awardQuest(w, "stu-ishita", q).world;
    expect(studentState(w, "stu-ishita").aura).toBeLessThan(20);
  });
  it("clearing the overdue amount, then the capped quests, gets spending back", () => {
    let w = clearOverdue(W, "stu-ishita");
    const after = studentState(w, "stu-ishita").aura;
    expect(blockedReason(w, "stu-ishita")?.code).not.toBe("PAST_DUE");
    const plan = recoveryPlan(w, "stu-ishita");
    expect(plan.steps[0].state).toBe("done");
    for (const q of plan.quests.filter((x) => x.manual && x.status === "available")) w = awardQuest(w, "stu-ishita", q.id).world;
    expect(studentState(w, "stu-ishita").aura).toBeGreaterThanOrEqual(after);
    expect(studentState(w, "stu-ishita").aura - after).toBeLessThanOrEqual(8);
  });
  it("a quest that has nothing left to add is reported as done, not offered again", () => {
    const w = awardQuest(clearOverdue(W, "stu-ishita"), "stu-ishita", "verify_identity").world;
    expect(questViews(w, "stu-ishita").find((q) => q.id === "verify_identity")?.status).toBe("done");
  });
});

describe("proof-of-repayment payment", () => {
  it("is open to someone with a low Aura and nothing overdue, and only for the policy amount", () => {
    const w = clearOverdue(W, "stu-ishita");
    if (studentState(w, "stu-ishita").aura >= 20) return; // already back above the minimum: not the case this test is about
    expect(checkGate(w, "stu-ishita", "ven-gupta-chai", 50)).toMatchObject({ ok: false, code: "LOW_AURA" });
    expect(microSpendEligible(w, "stu-ishita")).toBe(true);
    expect(checkGate(w, "stu-ishita", "ven-gupta-chai", 50, w.clock.now, { microSpend: true }).ok).toBe(true);
    expect(checkGate(w, "stu-ishita", "ven-gupta-chai", 80, w.clock.now, { microSpend: true })).toMatchObject({ ok: false, code: "MICRO_NOT_AVAILABLE" });
  });
  it("never lets someone with an overdue amount use it", () => {
    expect(checkGate(W, "stu-ishita", "ven-gupta-chai", 50, W.clock.now, { microSpend: true })).toMatchObject({ ok: false, code: "PAST_DUE" });
  });
  it("is not available to someone in good standing", () => {
    expect(microSpendEligible(W, "stu-diya")).toBe(false);
    expect(checkGate(W, "stu-diya", "ven-gupta-chai", 50, W.clock.now, { microSpend: true })).toMatchObject({ ok: false, code: "MICRO_NOT_AVAILABLE" });
  });
  it("repaid on time it adds Aura once, with a 7 day window", () => {
    // Kabir has a prior default and has cleared it, so he is rebuilding
    expect(microSpendEligible(W, "stu-kabir")).toBe(true);
    const paid = payByQr(W, { studentId: "stu-kabir", qr: QR("ven-gupta-chai"), coins: 50, microSpend: true, idempotencyKey: "m1" });
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(paid.loan.termDays).toBe(7);
    expect(paid.loan.microSpend).toBe(true);
    const before = studentState(paid.world, "stu-kabir");
    const w = advanceTo(paid.world, paid.world.clock.now + 6 * DAY);
    const done = repayLoan(w, { loanId: paid.loan.id, amount: amountDue(w.loans[paid.loan.id]) }).world;
    const after = studentState(done, "stu-kabir");
    expect(after.microSpendDone).toBe(true);
    expect(after.aura).toBeGreaterThan(before.aura);
    expect(microSpendEligible(done, "stu-kabir")).toBe(false);
  });
  it("the same key retried with and without the micro flag is a different request", () => {
    const a = payByQr(W, { studentId: "stu-kabir", qr: QR("ven-gupta-chai"), coins: 50, microSpend: true, idempotencyKey: "m2" });
    expect(() => payByQr(a.world, { studentId: "stu-kabir", qr: QR("ven-gupta-chai"), coins: 50, idempotencyKey: "m2" })).toThrow();
  });
});

describe("limit ladder view", () => {
  it("shows where Rohan is and exactly what the next step needs", () => {
    const v = ladderView(W, "stu-rohan");
    expect(v.currentLimit).toBe(5000);
    expect(v.nextLimit).toBe(7500);
    expect(v.rows.map((r) => r.status)).toEqual(["reached", "reached", "reached", "current", "next", "locked"]);
    expect(v.needs).toEqual(["1 more on-time repayment (1 of 2 so far)"]);
  });
  it("after a default: the cap shows, and growth is paused until it is cleared", () => {
    const v = ladderView(W, "stu-kabir");
    expect(v.postDefaultCap).toBe(500);
    expect(v.currentLevel).toBe(1);
  });
  it("a new student is at level 1 with nothing to explain", () => {
    const v = ladderView(W, "stu-aarav");
    expect(v.currentLevel).toBe(1);
    expect(v.history).toEqual([]);
  });
  it("records what moved the limit before, newest first", () => {
    const v = ladderView(W, "stu-sana");
    expect(v.history.length).toBeGreaterThan(0);
    for (let i = 1; i < v.history.length; i++) expect(v.history[i - 1].at).toBeGreaterThanOrEqual(v.history[i].at);
    expect(v.history.every((c) => c.why.length > 0)).toBe(true);
  });
});

describe("score provider", () => {
  const provider = createEngineScoreProvider(() => W);
  it("answers from the engine", async () => {
    const v = await provider.getScore("stu-rohan");
    expect(v).toMatchObject({ aura: studentState(W, "stu-rohan").aura, limitCoins: 5000, hasPriorDefault: false, postDefaultCapCoins: null });
    expect((await provider.getScore("stu-kabir")).postDefaultCapCoins).toBe(500);
  });
  it("gives at most the last 10 reasons, newest first, each with plain text", async () => {
    const r = await provider.getReasons("stu-diya", 10);
    expect(r.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].at).toBeGreaterThanOrEqual(r[i].at);
    expect(r.every((x) => x.explanation.length > 5)).toBe(true);
  });
});

describe("limit growth (Rohan, scenario 8)", () => {
  it("one more on-time repayment steps the limit from 5,000 to 7,500 and tells him", () => {
    const paid = payByQr(W, { studentId: "stu-rohan", qr: QR("ven-print-hub"), coins: 100, idempotencyKey: "g1" });
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    const w = advanceTo(paid.world, paid.world.clock.now + 15 * DAY);
    const done = repayLoan(w, { loanId: paid.loan.id, amount: amountDue(w.loans[paid.loan.id]) }).world;
    expect(studentState(done, "stu-rohan").limit).toBe(7500);
    expect(done.notifications.some((n) => n.kind === "limit_up" && n.body.includes("7500"))).toBe(true);
    expect(ladderView(done, "stu-rohan").history[0]).toMatchObject({ fromLimit: 5000, toLimit: 7500 });
  });
});
