import { describe, expect, it } from "vitest";
import { PERSONAS, SEED, SEED_NOW } from "./constants";
import { buildSeedWorld } from "./seed";
import { amountDue, availableLimit, blockedReason, studentState } from "../domain/selectors";
import { krsFromAura } from "../aura/engine";
import { ladderLimit } from "../policy";
import type { WorldState } from "../domain/types";

const w: WorldState = buildSeedWorld();

describe("seed world", () => {
  it("is deterministic: the same seed builds the same world", () => {
    expect(JSON.stringify(buildSeedWorld(SEED, SEED_NOW))).toBe(JSON.stringify(w));
  });
  it("ends at the demo date and starts the live clock there", () => {
    expect(w.clock.now).toBe(SEED_NOW);
    expect(w.clock.startedAt).toBe(SEED_NOW);
  });
  it("every persona points at a real account", () => {
    for (const p of PERSONAS) {
      if (p.studentId) expect(w.students[p.studentId], p.id).toBeDefined();
      if (p.vendorId) expect(w.vendors[p.vendorId], p.id).toBeDefined();
    }
  });
  it("the ledger reconciles: every loan's repayments add up to what it says was repaid", () => {
    for (const l of Object.values(w.loans)) {
      const sum = w.repayments.filter((r) => r.loanId === l.id).reduce((s, r) => s + r.amount, 0);
      expect(sum, l.id).toBe(l.repaid);
      expect(l.totalRepayable, l.id).toBe(l.coins + l.fee + l.interest);
      expect(amountDue(l), l.id).toBeGreaterThanOrEqual(0);
      if (l.status === "paid") expect(amountDue(l), l.id).toBe(0);
    }
  });
  it("every settlement equals its payments, and settled payments belong to a paid settlement", () => {
    for (const s of Object.values(w.settlements)) {
      const loans = s.loanIds.map((id) => w.loans[id]);
      expect(loans.every((l) => l.vendorId === s.vendorId), s.id).toBe(true);
      expect(s.grossCoins, s.id).toBe(loans.reduce((a, l) => a + l.coins, 0));
      expect(s.totalAmount, s.id).toBe(s.grossCoins - s.refundCoins + s.adjustmentCoins);
    }
    for (const l of Object.values(w.loans)) if (l.vendorStatus === "settled") expect(w.settlements[l.settlementId!].status, l.id).toBe("paid");
  });
  it("no ID numbers or protected attributes are stored", () => {
    for (const s of Object.values(w.students)) expect(s.idMasked).toMatch(/[•*]/);
  });
  it("audit ids are strictly ordered", () => {
    const ids = w.audit.map((a) => a.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/** The persona table the demo scenarios rely on. If the engine or policy changes, this tells you which story moved. */
describe("persona table", () => {
  const rows: [string, number, number, string | null][] = [
    ["stu-aarav", 50, 1000, null],
    ["stu-diya", 68, 3000, null],
    ["stu-rohan", 82, 5000, null],
    ["stu-meera", 58, 2000, "PAST_DUE"],
    ["stu-kabir", 31, 1000, null],
    ["stu-ishita", 15, 1000, "PAST_DUE"],
    ["stu-neel", 24, 1000, null],
    ["stu-sana", 74, 5000, null],
  ];
  it.each(rows)("%s: Aura %i, ladder limit %i, block %s", (id, aura, limit, block) => {
    const s = studentState(w, id);
    expect(s.aura).toBe(aura);
    expect(s.limit).toBe(limit);
    expect(ladderLimit(s.level)).toBe(limit);
    expect(blockedReason(w, id)?.code ?? null).toBe(block);
  });
  it("KRS is derived from Aura by the one formula", () => {
    expect(krsFromAura(50)).toBe(600);
    expect(krsFromAura(100)).toBe(800);
  });
  it("a blocked student has nothing spendable but a defaulter's cap is within the limit", () => {
    expect(availableLimit(w, "stu-kabir")).toBeLessThanOrEqual(1000);
  });
  it("Sana's rewards were paid out at most once a week", () => {
    const rewards = w.scoreEvents.filter((e) => e.studentId === "stu-sana" && e.scored && (e.kind === "ON_TIME" || e.kind === "EARLY_CLOSE")).map((e) => e.at);
    for (let i = 1; i < rewards.length; i++) expect(rewards[i] - rewards[i - 1]).toBeGreaterThanOrEqual(7 * 86_400_000 - 1);
  });
});
