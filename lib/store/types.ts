import type { AppStatus, ConsentId, Instalment, Offer, PaymentRecord, PayState, RejectionReason, Ticket, TicketEvent } from "@/lib/mock-portal";
import type { AuditEntry, FraudOutcome, FraudStatus, OpsRole } from "@/lib/mock-ops";
import type { AuraPreset } from "@/lib/score/types";

export type VerificationStatus = "not_started" | "pending" | "accepted" | "rejected" | "expired" | "resubmission";
export type KycStatus = "not_started" | "in_progress" | "provider_error" | "retry_limit" | "escalated" | "verified";
export type AuthEdge = "none" | "session_expired" | "locked" | "suspicious";

export interface TimelineEvent {
  id: string;
  at: string;
  title: string;
  detail?: string;
}

/**
 * In-memory wizard draft. NEVER persisted (excluded in partialize) because it may hold an
 * identity / enrolment number. ID photos are not here at all: they live only in component state.
 */
export interface VerificationDraft {
  college: string;
  collegeNotListed: boolean;
  requestedCollege: string;
  idNumber: string;
  fullName: string;
  course: string;
  year: string;
  email: string;
  dob: string;
}

export interface VerificationSummary {
  college: string;
  fullName: string;
  course: string;
  year: string;
  /** masked, e.g. "••••2041" */
  idMasked: string;
  hasFront: boolean;
  hasBack: boolean;
}

export interface Loan {
  id: string;
  product: string;
  lender: string;
  principal: number;
  tenure: number;
  disbursedOn: string;
  acceptance: { at: string; offerVersion: string; termsVersion: string };
  fees: number;
  penalties: number;
  schedule: Instalment[];
}

export interface Dispute {
  ref: string;
  paymentId: string;
  category: string;
  description: string;
  hasEvidence: boolean;
  status: "Raised" | "Under review" | "Resolved";
  at: string;
}

export interface DataRequest {
  ref: string;
  type: "access" | "correction" | "deletion" | "credit_correction" | "withdrawal";
  detail: string;
  at: string;
  status: "Received" | "In progress" | "Completed";
}

export interface OpsDecision {
  status: "approved" | "rejected" | "info_requested" | "escalated";
  code: string;
  by: string;
  at: string;
  note?: string;
}

export interface OpsFraudState {
  status: FraudStatus;
  outcome: FraudOutcome;
  notes: { by: string; at: string; text: string }[];
}

export interface OpsTicketState {
  status?: "open" | "in_progress" | "awaiting" | "resolved" | "escalated";
  assignee?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  messages: { id: string; at: string; who: "student" | "agent"; text: string }[];
  internal: { id: string; at: string; by: string; text: string }[];
  history: { id: string; at: string; by: string; text: string }[];
}

export interface PortalState {
  session: { loggedIn: boolean; mobile: string; edge: AuthEdge; otpAttempts: number; timeoutWarning: boolean };
  profile: { displayName: string; language: string; notif: { sms: boolean; email: boolean; push: boolean } };
  consents: Record<ConsentId, { granted: boolean; at: string; version: string } | null>;
  verification: {
    status: VerificationStatus;
    reason: RejectionReason | null;
    attempts: number;
    submittedAt: string | null;
    summary: VerificationSummary | null;
    timeline: TimelineEvent[];
    celebrated: boolean;
    /** wizard step to return to on resubmit */
    resumeStep: number | null;
    notListedRef: string | null;
  };
  kyc: { status: KycStatus; retries: number; reference: string | null; maskedId: string | null };
  loanApp: {
    status: AppStatus;
    productId: string | null;
    amount: number;
    tenure: number;
    info: { range: string; source: string; obligations: string; reference: string };
    offer: Offer | null;
    acceptance: { at: string; offerVersion: string; termsVersion: string; loanId: string } | null;
    declineCode: string | null;
    moreInfoReply: string | null;
    submittedAt: string | null;
  };
  loans: Loan[];
  payments: { extra: PaymentRecord[]; stateOverride: Record<string, PayState> };
  disputes: Dispute[];
  tickets: Ticket[];
  requests: DataRequest[];
  ops: {
    role: OpsRole;
    audit: AuditEntry[];
    decisions: Record<string, OpsDecision>;
    fraud: Record<string, OpsFraudState>;
    tickets: Record<string, OpsTicketState>;
    reconFlags: Record<string, boolean>;
    escalations: { ref: string; target: string; summary: string; at: string }[];
    retries: Record<string, string>;
  };
  demo: { open: boolean; autoAccept: boolean; paymentOutcome: PayState };
  /** Aura (mock mode): which demo preset to show (null: derived from the portal state), and quest flags. */
  aura: { preset: AuraDemoPreset | null; statementReviewed: boolean };
}

export type AuraDemoPreset = AuraPreset | "unavailable";

export type { TicketEvent };
