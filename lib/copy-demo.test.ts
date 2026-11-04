import { describe, expect, it } from "vitest";
import * as copy from "./copy-demo";

/**
 * Copy review (docs/MVP_DEMO_PROMPT.md, B1.10): slang only in headlines, empty states and success toasts; money, fees,
 * dates, consent, errors and legal text are plain; never shame a low score; coins are a display unit, not a wallet.
 */

/** Every string in a copy tree. Functions are called with a few sample arguments so their text is checked too. */
function strings(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (typeof x === "function") {
    for (const args of [[5, 5, 5], ["2026-10-30", 5, "UTR0000000001"], ["Gupta Chai Tapri", 5], [5, "2026-10-30", "UTR1"], ["x", "y", "z"]]) {
      try {
        const out = (x as (...a: unknown[]) => unknown)(...args);
        if (out !== undefined) return strings(out);
      } catch {
        /* try the next set of arguments */
      }
    }
    return [];
  }
  if (Array.isArray(x)) return x.flatMap(strings);
  if (x && typeof x === "object") return Object.values(x).flatMap(strings);
  return [];
}

const ALL = Object.entries(copy).filter(([k]) => !["TIER_LABEL"].includes(k));
const everything = ALL.flatMap(([, v]) => strings(v));

/** The sections that are money, dates, consent, errors or legal text: no slang at all. */
const PLAIN = ["NOTE", "GATE", "PAYGATE", "ONB", "SETTLE", "REFUND", "FLOW", "METRICS", "ERROR_W", "LIMIT_W", "RECOVER_W", "AURA_W", "ROLES"] as const;
const SLANG = /\b(no cap|lowkey|vibe check|vibes?|main character|slay|rizz|bestie|sus|goated|lore|aura farmer|side quest|reset arc|fresh spawn)\b|\bW\b/i;

describe("copy rules", () => {
  it("plain sections contain no slang", () => {
    for (const name of PLAIN) {
      const found = strings((copy as Record<string, unknown>)[name]).filter((s) => SLANG.test(s));
      expect(found, name).toEqual([]);
    }
  });
  it("has no em or en dashes anywhere", () => {
    expect(everything.filter((s) => /[—–]/.test(s))).toEqual([]);
  });
  it("never shames a low score or a late payment", () => {
    const shame = /\b(loser|irresponsible|deadbeat|bad borrower|your fault|shame|reckless|untrustworthy|cheat)\b/i;
    expect(everything.filter((s) => shame.test(s))).toEqual([]);
  });
  it("never calls coins a wallet, a balance to top up, withdraw or transfer, except to say they are not", () => {
    const risky = /\b(wallet|top[- ]?up|topped up|withdraw|withdrawn|transfer)\b/i;
    const negated = /\b(aren't|isn't|can't|cannot|never|not|no)\b/i;
    expect(everything.filter((s) => risky.test(s) && !negated.test(s))).toEqual([]);
  });
  it("says Kredo never holds or moves money where it explains the flow", () => {
    expect(copy.FLOW.statement).toMatch(/Kredo only records, scores and reports/);
    expect(copy.FLOW.title).toBe("Kredo does not touch money");
    expect(copy.FLOW.nodes.kredoSub).toBe("records + scores");
  });
  it("every error message says what happened and offers a way forward", () => {
    for (const s of strings(copy.PAYGATE)) expect(s.length).toBeGreaterThan(20);
    expect(copy.ERROR_W.body).toMatch(/resetting the demo/);
  });
  it("uses no real brand or person names in the seeded copy samples", () => {
    const brands = /\b(paytm|phonepe|gpay|google pay|razorpay|hdfc bank|sbi|icici|amazon|zomato|swiggy)\b/i;
    expect(everything.filter((s) => brands.test(s))).toEqual([]);
  });
});
