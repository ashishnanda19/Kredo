/**
 * Brand + non-copy constants. All copy lives in lib/copy.ts.
 * Rename the product by editing BRAND.name (everything else reads from here).
 * ALL values here are placeholders for a design preview.
 */

export const BRAND = {
  name: "Kredo",
  supportEmail: "help@kredo.example", // placeholder
  partnerEmail: "campus@kredo.example", // placeholder
} as const;

/** Currency prefix used by formatINR(). */
export const CURRENCY_PREFIX = "₹";

/** Mock pricing used in the pay flow. Placeholder numbers only. */
export const PRICING = {
  platformFee: 5, // flat, per payment
  dueInDays: 15,
} as const;

/** Placeholder grievance contact. Replace with real officer details before launch. */
export const GRIEVANCE = {
  officer: "Grievance Officer (placeholder)",
  email: "grievance@kredo.example",
  response: "We aim to reply within 7 working days.",
} as const;
