/**
 * Verification: KYC and bank-account (penny-drop) checks. Simulated in the demo; the presenter chooses the outcome.
 * Real providers replace the mock later. ID numbers and photos are never stored or sent.
 */
export type KycOutcome = "verified" | "needs_retry" | "provider_error";
export type PennyDropOutcome = "success" | "name_mismatch" | "provider_error";

export interface KycRequest {
  kind: "student" | "vendor";
  /** Masked only. */
  idMasked: string;
}

export interface PennyDropRequest {
  bankMasked: string;
  ifsc: string;
  ownerName: string;
  stallName: string;
}

export interface VerificationProvider {
  submitKyc(req: KycRequest): Promise<{ outcome: KycOutcome }>;
  /** Credits ₹1 to the account and checks the holder's name against the owner or stall. */
  pennyDrop(req: PennyDropRequest): Promise<{ outcome: PennyDropOutcome; holderName?: string }>;
}

export function createMockVerification(opts: { kyc?: () => KycOutcome; pennyDrop?: () => PennyDropOutcome } = {}): VerificationProvider {
  return {
    async submitKyc() {
      return { outcome: opts.kyc?.() ?? "verified" };
    },
    async pennyDrop(req) {
      const outcome = opts.pennyDrop?.() ?? "success";
      return { outcome, holderName: outcome === "success" ? req.ownerName : outcome === "name_mismatch" ? "A. N. Other" : undefined };
    },
  };
}
