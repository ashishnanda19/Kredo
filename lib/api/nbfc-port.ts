/**
 * The port to the lending partner (NBFC). Kredo is the app and tech partner: it records, scores and REPORTS. The
 * lender does the credit assessment and moves the money. This interface therefore has exactly two methods:
 *
 *   submitSettlement   report what a vendor is owed for a business day (the lender pays the vendor)
 *   getRepaymentStatus ask the lender whether a student's repayment arrived (students repay the lender directly)
 *
 * There is deliberately no method to move, load, hold, pool or transfer money. A unit test pins this surface.
 */
export interface SettlementInstruction {
  settlementId: string;
  vendorId: string;
  /** India-time business date the batch covers. */
  date: string;
  /** Rupees (= coins). */
  amountRupees: number;
  paymentCount: number;
  /** Masked: never a full account number. */
  bankMasked: string;
  paymentIds: string[];
}

export type SettlementResult =
  | { status: "paid"; reference: string; failureReason?: undefined }
  | { status: "failed"; failureReason: string; reference?: undefined }
  | { status: "on_hold"; failureReason: string; reference?: undefined };

export interface RepaymentStatus {
  loanId: string;
  status: "received" | "pending" | "unknown";
  amountRupees?: number;
}

export interface NbfcPort {
  submitSettlement(instruction: SettlementInstruction): Promise<SettlementResult>;
  getRepaymentStatus(loanId: string): Promise<RepaymentStatus>;
}

export type NbfcScenario = "paid" | "failed" | "on_hold";

/** A short stable reference derived from the settlement id (a stand-in for the bank's UTR). */
export function mockReference(settlementId: string): string {
  let h = 2166136261;
  for (const ch of settlementId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return `UTR${String(h).padStart(10, "0").slice(-10)}`;
}

/** The demo lender. The presenter picks the outcome (paid, failed, on hold) in the Demo Director. */
export function createMockNbfc(opts: { scenario?: () => NbfcScenario; delayMs?: number; repaid?: (loanId: string) => number | null } = {}): NbfcPort {
  const delay = opts.delayMs ?? 0;
  const wait = () => (delay > 0 ? new Promise<void>((r) => setTimeout(r, delay)) : Promise.resolve());
  return {
    async submitSettlement(i) {
      await wait();
      const scenario = opts.scenario?.() ?? "paid";
      if (scenario === "failed") return { status: "failed", failureReason: "Bank account could not be credited. The lender will retry." };
      if (scenario === "on_hold") return { status: "on_hold", failureReason: "Held for a routine check by the lender." };
      return { status: "paid", reference: mockReference(i.settlementId) };
    },
    async getRepaymentStatus(loanId) {
      await wait();
      const paid = opts.repaid?.(loanId);
      return paid == null ? { loanId, status: "unknown" } : { loanId, status: "received", amountRupees: paid };
    },
  };
}
