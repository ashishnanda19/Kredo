import { ACCOUNT_AGE_DAYS, INTERNAL_SCORE, type LoanProduct } from "@/lib/mock-portal";

export interface EligibilityContext {
  verified: boolean;
  kyc: boolean;
}

/** Returns the exact unmet conditions (labels) for a product. Empty = eligible. */
export function unmetConditions(product: LoanProduct, ctx: EligibilityContext): string[] {
  return product.conditions
    .filter((c) => {
      if (c.id === "verified") return !ctx.verified;
      if (c.id === "kyc") return !ctx.kyc;
      if (c.id === "age") return ACCOUNT_AGE_DAYS < (c.min ?? 0);
      return INTERNAL_SCORE < (c.min ?? 0);
    })
    .map((c) => c.label);
}
