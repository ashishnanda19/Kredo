import { expect, test } from "@playwright/test";
import { AURA } from "../lib/copy-aura";
import { COPY } from "../lib/copy";

/**
 * Part B: "No slang appears in overdue, fee, consent, error or legal copy." Slang lives only in the fun layer (tier
 * names, chips, streaks, quests, success toasts). Everything checked here is plain copy: notices (overdue, consent,
 * holds), states and errors, the about page (legal, data and consent), limit blockers, what-if text, history text,
 * negative reasons and the disclaimers.
 */
const SLANG = /\b(no cap|lowkey|locked in|vibe check|vibe|main character|slay|rizz|bestie|sus|bet|fr|goated|lore|farmer|spawn|side quest|reset arc)\b|\bW\b/i;

/** Every string in a copy tree; functions are called with a sample amount so their text is checked too. */
function strings(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (typeof x === "function") return strings((x as (...a: unknown[]) => unknown)("₹1,000", "₹1,000"));
  if (Array.isArray(x)) return x.flatMap(strings);
  if (x && typeof x === "object") return Object.values(x).flatMap(strings);
  return [];
}

const PLAIN: Record<string, unknown> = {
  "disclaimer and limits": [AURA.disclaimer, AURA.partnerDecides, AURA.estimate],
  "knockout, hold and consent notices": AURA.notices,
  "states and errors": AURA.states,
  "about, data and dispute": AURA.about,
  "negative reasons and their actions": [AURA.holdbacks, AURA.unknownHoldback],
  "limit ladder text": { blockers: AURA.levelUp.blockers, cleanCycle: AURA.levelUp.cleanCycle, cyclesTo: AURA.levelUp.cyclesTo, noLevel: AURA.levelUp.noLevel, top: AURA.levelUp.top },
  "what-if text": [AURA.levelUp.whatIfBody, AURA.levelUp.whatIfFlat, AURA.levelUp.whatIfError, AURA.levelUp.whatIfBusy, AURA.levelUp.whatIfNone, AURA.levelUp.whatIfResult, AURA.levelUp.whatIfNow],
  "history explanations": [AURA.history.markers, AURA.history.frozen, AURA.history.empty],
  "legal and lender copy": COPY.legal,
};

for (const [name, tree] of Object.entries(PLAIN)) {
  test(`plain copy has no slang: ${name}`, () => {
    const found = strings(tree).filter((s) => SLANG.test(s));
    expect(found).toEqual([]);
  });
}

test("the slang check itself catches slang", () => {
  for (const s of ["Locked in on repayments", "no cap", "Early bird W", "Main Character"]) expect(SLANG.test(s)).toBe(true);
  for (const s of ["New loans are paused because ₹1,000 is overdue.", "Your first on-time repayment shows up here."]) expect(SLANG.test(s)).toBe(false);
});

test("every Aura screen's disclaimer says it is not a credit bureau score", () => {
  expect(AURA.disclaimer).toMatch(/Not a credit bureau score and does not change your CIBIL/);
  expect(strings(AURA.notices).join(" ")).not.toMatch(/credit score/i); // it is Aura, never "a credit score"
});

test("negative reasons never carry a chip or slang, and each links to an action", () => {
  for (const [code, h] of Object.entries(AURA.holdbacks)) {
    expect(Object.keys(h).sort(), code).toEqual(["action", "href", "text"]);
    expect(h.href.startsWith("/")).toBe(true);
  }
});
