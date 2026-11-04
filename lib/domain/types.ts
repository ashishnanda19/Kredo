/**
 * Domain types for the MVP demo world (docs/MVP_DEMO_PROMPT.md, B15).
 *
 * MONEY BOUNDARY: a coin is a display unit, 1 coin = ₹1. Nothing here is a wallet. A student's spendable coins are
 * their AVAILABLE LIMIT (sanctioned limit minus outstanding principal); a vendor's coins received are a RECEIVABLE
 * (what the lender will pay them). Kredo records and scores; the lender moves money.
 *
 * Times are epoch milliseconds on the simulated clock. Due dates are India-time calendar dates ("YYYY-MM-DD").
 */
import type { QuestId, TierId } from "../policy";

export type Role = "student" | "vendor" | "ops";

export type AccountStatus = "not_started" | "pending" | "accepted" | "rejected" | "resubmission" | "suspended" | "expired";

export interface Account {
  id: string;
  role: "student" | "vendor";
  displayName: string;
  /** Masked, e.g. "+91 98••• ••210". Never a full number. */
  phoneMasked: string;
  status: AccountStatus;
  /** A student and a vendor with the same device link belong to one person: they can never pay each other. */
  deviceLinkId?: string;
  createdAt: number;
}

export interface StudentProfile {
  accountId: string;
  firstName: string;
  lastInitial: string;
  /** A fictional college. Never a scoring input. */
  college: string;
  /** Masked ID, never the number itself. */
  idMasked: string;
  verification: AccountStatus;
  /** Which demo persona this is, if any. */
  persona?: string;
}

export type VendorCategory = "food" | "print" | "stationery" | "laundry" | "other";

/** Where a stall is in its onboarding. Only masked values are kept: never an ID number or a full account number. */
export interface VendorOnboarding {
  /** Last ID digits only, shown masked. */
  idMasked?: string;
  kyc: "none" | "verified";
  /** A small stall with no business registration is allowed, with a lower daily cap. */
  hasBusinessProof: boolean;
  ifsc?: string;
  bank: "none" | "verified" | "name_mismatch" | "provider_error";
  /** The account holder name the bank returned on a mismatch, so the owner can see why. */
  bankHolderSeen?: string;
  agreedAt?: number;
  submittedAt?: number;
  decidedAt?: number;
  /** Why a stall was rejected, or asked to resubmit. */
  reason?: string;
}

export interface VendorProfile {
  accountId: string;
  stallName: string;
  ownerName: string;
  category: VendorCategory;
  campusArea: string;
  hours: string;
  bankMasked: string;
  bankVerified: boolean;
  /** "light" is a small stall with no business registration: a lower daily cap. */
  verificationLevel: "full" | "light";
  /** Daily receivable cap in coins. */
  dailyCap: number;
  /** Bumped when the QR is regenerated; the old QR stops working. */
  qrVersion: number;
  status: AccountStatus;
  /** Present for stalls created through the onboarding wizard. Seeded stalls were verified before the demo began. */
  onboarding?: VendorOnboarding;
}

export type LoanStatus = "active" | "paid" | "overdue" | "defaulted" | "refunded";
export type VendorPaymentStatus = "received" | "settled" | "refunded" | "disputed";

/** One spend = one loan. */
export interface Loan {
  id: string;
  studentId: string;
  vendorId: string;
  /** Principal in coins (= ₹). */
  coins: number;
  fee: number;
  interest: number;
  totalRepayable: number;
  /** India-time due date. */
  dueDate: string;
  termDays: number;
  status: LoanStatus;
  /** The vendor's side: received until the nightly settlement, then settled. */
  vendorStatus: VendorPaymentStatus;
  idempotencyKey: string;
  /** What the key was created for; the same key with a different body is a conflict, not a second loan. */
  bodyKey: string;
  createdAt: number;
  /** Total repaid so far, in rupees. */
  repaid: number;
  closedAt?: number;
  defaultedAt?: number;
  /** Coins refunded to the student (reduces what is owed and what the vendor is paid). */
  refundedCoins: number;
  settlementId?: string;
  /** Marks the small "proof of repayment" spend a student below the threshold may take. */
  microSpend?: boolean;
}

export interface Repayment {
  id: string;
  loanId: string;
  studentId: string;
  amount: number;
  at: number;
  kind: "partial" | "full";
  /** How the amount was applied. Fees and interest are cleared first, then principal. */
  applied: { fee: number; interest: number; principal: number };
  idempotencyKey?: string;
}

/** A negative amount owed back by the vendor (a refund after settlement), netted into the next batch. */
export interface VendorAdjustment {
  id: string;
  vendorId: string;
  coins: number;
  reason: string;
  loanId: string;
  createdAt: number;
  settlementId?: string;
}

/** A vendor's refund of one payment. Full refunds only. Large ones wait for ops. */
export interface Refund {
  id: string;
  loanId: string;
  vendorId: string;
  studentId: string;
  coins: number;
  reason: string;
  requestedAt: number;
  status: "done" | "pending_ops" | "declined";
  /** Before the nightly settlement the payment is simply left out of it; after, a negative adjustment is netted into the next. */
  mode?: "pre_settlement" | "post_settlement";
  decidedAt?: number;
  decidedBy?: string;
  declineReason?: string;
}

export interface VendorReceivable {
  vendorId: string;
  /** India-time date. */
  date: string;
  totalCoins: number;
  status: "awaiting_settlement" | "settled";
  settlementId?: string;
}

export type SettlementStatus = "scheduled" | "processing" | "paid" | "failed" | "on_hold";

/** The instruction Kredo reports to the lender. Kredo never moves this money. */
export interface Settlement {
  id: string;
  vendorId: string;
  /** India-time business date the batch covers. */
  date: string;
  grossCoins: number;
  refundCoins: number;
  adjustmentCoins: number;
  /** gross - refunds + adjustments (adjustments are negative). */
  totalAmount: number;
  count: number;
  loanIds: string[];
  adjustmentIds: string[];
  bankMasked: string;
  status: SettlementStatus;
  reference?: string;
  failureReason?: string;
  createdAt: number;
  updatedAt: number;
}

export type ScoreEventKind =
  | "LIMIT_OVERRIDE"
  | "ON_TIME"
  | "WITHIN_GRACE"
  | "LATE_1_7"
  | "LATE_8_30"
  | "DEFAULT"
  | "DEFAULT_CLEARED"
  | "PARTIAL_PAID"
  | "EARLY_CLOSE"
  | "HIGH_UTIL"
  | "QUEST_VERIFY_IDENTITY"
  | "QUEST_VERIFY_BANK"
  | "QUEST_SET_REMINDERS"
  | "QUEST_STREAK_3"
  | "QUEST_MICRO_SPEND"
  | "LIMIT_APPROVED";

export interface ScoreEvent {
  id: string;
  studentId: string;
  at: number;
  kind: ScoreEventKind;
  /** The raw Aura effect, before the recency weight. */
  delta: number;
  /** Plain-English code shown with the effect, e.g. ON_TIME, LATE_1_7, QUEST_*. */
  reasonCode: string;
  explanation: string;
  loanId?: string;
  /** For ON_TIME: false when the reward cooldown was still running, so the repayment earned no points and did not extend the streak. */
  scored?: boolean;
  /** Extra facts the engine needs to replay the history (amounts, levels). */
  meta?: Record<string, number | string | boolean>;
}

export interface Notification {
  id: string;
  at: number;
  accountId: string;
  kind: "reminder" | "overdue" | "limit_up" | "limit_down" | "settlement" | "default" | "info";
  title: string;
  body: string;
  loanId?: string;
}

/** Append-only. Nothing in the app edits or removes an entry. */
export interface WorldAuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  target: string;
  details: Record<string, string | number | boolean>;
}

export interface DemoClock {
  /** The simulated now. */
  now: number;
  /** Where the seeded history ends and the live demo begins. */
  startedAt: number;
  history: { at: number; label: string }[];
}

export interface WorldState {
  /** Bumped when the shape of the world changes, so an old saved world is discarded instead of misread. */
  schema: number;
  seed: number;
  clock: DemoClock;
  accounts: Record<string, Account>;
  students: Record<string, StudentProfile>;
  vendors: Record<string, VendorProfile>;
  loans: Record<string, Loan>;
  repayments: Repayment[];
  adjustments: VendorAdjustment[];
  settlements: Record<string, Settlement>;
  scoreEvents: ScoreEvent[];
  notifications: Notification[];
  audit: WorldAuditEntry[];
  flags: FraudFlag[];
  /** False while the seed is being built (history is not scanned for fraud), true for the live demo. */
  monitoring: boolean;
  refunds: Refund[];
  /** The last cut-off already processed (epoch ms). A cut-off never runs twice. */
  lastCutoff: number;
  /** Counter for deterministic ids. */
  seq: number;
}

/** A rule hit worth an ops look: a blocked self-pay, a velocity breach and so on. Rules, not a model. */
export type FraudFlagKind = "SELF_PAY" | "VELOCITY_STUDENT" | "VELOCITY_VENDOR" | "ROUND_CLUSTER" | "CONCENTRATION" | "SHARED_DEVICE";

export interface FraudFlag {
  id: string;
  at: number;
  kind: FraudFlagKind;
  studentId: string;
  vendorId: string;
  detail: string;
  status: "open" | "dismissed" | "confirmed";
  /** Who decided it and why, once an analyst has looked. */
  decidedBy?: string;
  decidedAt?: number;
  note?: string;
}

export interface Session {
  studentId: string | null;
  vendorId: string | null;
  activeRole: "student" | "vendor" | null;
  /** Wall-clock time of the last PIN or OTP confirmation (a real-time security check, not the simulated clock). */
  confirmedAt: number | null;
}

export interface QuestState {
  id: QuestId;
  status: "available" | "done";
}

export type { QuestId, TierId };
