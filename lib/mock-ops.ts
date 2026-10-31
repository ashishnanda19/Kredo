/**
 * Mock data for the internal operations dashboard. Fictional placeholders only.
 * Identifiers are masked. NO fraud-detection rules or thresholds appear anywhere in this file.
 */
import { addDays, MOCK_TODAY } from "./format";
import { COLLEGES, type RejectionReason } from "./mock-portal";

const iso = (days: number, h = 10) => new Date(addDays(MOCK_TODAY, days).getTime() + (h - 9) * 3_600_000).toISOString();

export type OpsRole = "reviewer" | "fraud" | "support" | "admin";
export const OPS_ROLES: { id: OpsRole; label: string }[] = [
  { id: "reviewer", label: "Verification reviewer" },
  { id: "fraud", label: "Fraud analyst" },
  { id: "support", label: "Support agent" },
  { id: "admin", label: "Admin" },
];
export const TEAM = ["Asha (placeholder)", "Ravi (placeholder)", "Meera (placeholder)", "Dev (placeholder)"];

/* ----------------------------------------------------- verification queue */
export type QueueStatus = "pending" | "failed" | "expired" | "escalated" | "accepted";
export const REVIEW_REASON_CODES = [
  { code: "V-OK", label: "Details match the ID" },
  { code: "V-BLUR", label: "ID image not readable" },
  { code: "V-NAME", label: "Name does not match" },
  { code: "V-EXP", label: "ID card expired" },
  { code: "V-COLL", label: "College not recognised" },
  { code: "V-DUP", label: "Possible duplicate, needs a closer look" },
];

export interface QueueItem {
  id: string;
  mobile: string;
  idMasked: string;
  college: string;
  submitted: string;
  status: QueueStatus;
  reason?: RejectionReason;
  attempts: number;
  assignee: string | null;
  /** what the student typed vs what is on the ID (placeholder data). Mismatch is highlighted. */
  entered: { name: string; college: string; course: string; dob: string };
  onId: { name: string; college: string; course: string; dob: string };
  kycStatus: "verified" | "in_progress" | "provider_error" | "escalated" | "not_started";
}

const FIRST = ["Aarav S.", "Diya M.", "Kabir R.", "Ananya P.", "Rohan K.", "Ishita G.", "Vihaan T.", "Meera N.", "Arjun D.", "Saanvi B.", "Reyansh J.", "Kiara L.", "Aditya V.", "Myra C.", "Dhruv A.", "Tara H.", "Neel O.", "Riya F.", "Yash E.", "Zoya Q."];
const REASONS: (RejectionReason | undefined)[] = [undefined, "blurry_id", undefined, "name_mismatch", "id_expired", undefined, "unreadable_back", "college_unrecognised", undefined, undefined];
const STATUSES: QueueStatus[] = ["pending", "pending", "failed", "pending", "expired", "escalated", "failed", "pending", "accepted", "escalated"];

export const QUEUE: QueueItem[] = Array.from({ length: 20 }, (_, i) => {
  const status = STATUSES[i % 10];
  const reason = status === "failed" || status === "escalated" ? REASONS[(i % 10) || 1] ?? "blurry_id" : undefined;
  const nameBad = reason === "name_mismatch";
  return {
    id: `APP-${10421 + i}`,
    mobile: `+91 9${i % 10}••• ••${String(10 + i * 3).slice(-2)}`,
    idMasked: `••••${String(2000 + i * 37).slice(-4)}`,
    college: COLLEGES[(i * 3) % COLLEGES.length],
    submitted: iso(-(i % 9) - 1, 9 + (i % 8)),
    status,
    reason,
    attempts: 1 + (i % 3),
    assignee: i % 4 === 0 ? null : ["Asha (placeholder)", "Ravi (placeholder)", "Meera (placeholder)"][i % 3],
    entered: { name: FIRST[i], college: COLLEGES[(i * 3) % COLLEGES.length], course: "B.Tech, 2nd year", dob: "2005-0" + ((i % 9) + 1) + "-14" },
    onId: { name: nameBad ? FIRST[(i + 3) % 20] : FIRST[i], college: reason === "college_unrecognised" ? "Unlisted Institute" : COLLEGES[(i * 3) % COLLEGES.length], course: "B.Tech, 2nd year", dob: "2005-0" + ((i % 9) + 1) + "-14" },
    kycStatus: (["verified", "in_progress", "provider_error", "escalated", "not_started"] as const)[i % 5],
  };
});

/* -------------------------------------------------------------------- fraud */
export type FraudStatus = "open" | "investigating" | "escalated" | "closed";
export type FraudOutcome = "confirmed" | "false_positive" | "inconclusive" | null;

export interface FraudAlert {
  id: string;
  type: "Duplicate submission" | "Verification anomaly";
  summary: string;
  applicationId: string;
  raisedAt: string;
  status: FraudStatus;
  outcome: FraudOutcome;
  /** indicators only: no rules, no thresholds */
  indicators: { label: string; source: string; at: string }[];
  notes: { by: string; at: string; text: string }[];
}

const IND: [string, string][] = [
  ["Same ID image appears on more than one application", "Document match service"],
  ["Entered details differ from ID details", "Verification result"],
  ["Several submissions from one device", "Session log"],
  ["Same mobile linked to another account", "Account records"],
];

export const FRAUD_ALERTS: FraudAlert[] = Array.from({ length: 12 }, (_, i) => ({
  id: `FRD-${3301 + i}`,
  type: i % 2 === 0 ? "Duplicate submission" : "Verification anomaly",
  summary: i % 2 === 0 ? "Possible duplicate submission" : "Details on ID do not match entered details",
  applicationId: `APP-${10421 + ((i * 5) % 20)}`,
  raisedAt: iso(-(i % 7) - 1, 8 + i),
  status: (["open", "open", "investigating", "escalated", "closed", "open"] as FraudStatus[])[i % 6],
  outcome: i % 6 === 4 ? (i % 2 ? "false_positive" : "confirmed") : null,
  indicators: [
    { label: IND[i % 4][0], source: IND[i % 4][1], at: iso(-(i % 7) - 1, 8 + i) },
    { label: IND[(i + 1) % 4][0], source: IND[(i + 1) % 4][1], at: iso(-(i % 7) - 1, 9 + i) },
  ],
  notes: i % 3 === 0 ? [{ by: "Ravi (placeholder)", at: iso(-1), text: "Looked at the two submissions side by side. Waiting for the student to respond." }] : [],
}));

/* ------------------------------------------------------- loan monitoring */
export interface OpsLoan {
  id: string;
  applicationId: string;
  student: string;
  product: string;
  amount: number;
  status: "Under assessment" | "More info needed" | "Offer ready" | "Accepted" | "Disbursed" | "Repaying" | "Overdue" | "Declined";
  action: string | null;
  outstanding: number;
}
const LSTAT: OpsLoan["status"][] = ["Under assessment", "More info needed", "Offer ready", "Accepted", "Disbursed", "Repaying", "Overdue", "Declined"];
export const OPS_LOANS: OpsLoan[] = Array.from({ length: 14 }, (_, i) => ({
  id: `LN-${24001 + i}`,
  applicationId: `APP-${10421 + i}`,
  student: `${FIRST[i]} (masked)`,
  product: ["Campus Starter", "Semester Support", "Final Year Flex"][i % 3],
  amount: [2000, 4000, 7000, 3000, 5000][i % 5],
  status: LSTAT[i % 8],
  action: ["Awaiting lender decision", "Waiting for student reply", null, "Confirm disbursement", null, null, "Call student (placeholder)", null][i % 8],
  outstanding: i % 8 < 4 ? 0 : [1800, 3000, 650, 5200][i % 4],
}));

export interface LoanEvent {
  id: string;
  at: string;
  kind: "Disbursement" | "Repayment";
  loanId: string;
  amount: number;
  status: "success" | "failed" | "retrying";
  retryNote?: string;
}
export const LOAN_EVENTS: LoanEvent[] = Array.from({ length: 15 }, (_, i) => {
  const failed = [2, 5, 8, 11, 13].includes(i);
  return {
    id: `EVT-${7001 + i}`,
    at: iso(-(i % 6), 9 + i),
    kind: i % 3 === 0 ? "Disbursement" : "Repayment",
    loanId: `LN-${24001 + (i % 14)}`,
    amount: [1070, 2000, 650, 4000, 500][i % 5],
    status: failed ? (i % 2 ? "retrying" : "failed") : "success",
    retryNote: failed ? ["Bank timeout. Retried once at 14:10.", "Account number rejected. Student asked to re-enter.", "Provider returned an error code. Waiting for the provider."][i % 3] : undefined,
  };
});

export interface ReconRecord {
  id: string;
  eventId: string;
  eventAmount: number;
  ledgerAmount: number | null;
  status: "matched" | "mismatched" | "missing";
  flagged: boolean;
}
export const RECON: ReconRecord[] = [
  { id: "R1", eventId: "EVT-7001", eventAmount: 1070, ledgerAmount: 1070, status: "matched", flagged: false },
  { id: "R2", eventId: "EVT-7002", eventAmount: 2000, ledgerAmount: 2000, status: "matched", flagged: false },
  { id: "R3", eventId: "EVT-7003", eventAmount: 650, ledgerAmount: 560, status: "mismatched", flagged: false },
  { id: "R4", eventId: "EVT-7004", eventAmount: 4000, ledgerAmount: 4000, status: "matched", flagged: false },
  { id: "R5", eventId: "EVT-7006", eventAmount: 1070, ledgerAmount: null, status: "missing", flagged: false },
  { id: "R6", eventId: "EVT-7007", eventAmount: 2000, ledgerAmount: 2000, status: "matched", flagged: false },
  { id: "R7", eventId: "EVT-7009", eventAmount: 4000, ledgerAmount: 3950, status: "mismatched", flagged: true },
  { id: "R8", eventId: "EVT-7010", eventAmount: 500, ledgerAmount: null, status: "missing", flagged: false },
];

/* ------------------------------------------------------------------ support */
export type OpsPriority = "low" | "normal" | "high" | "urgent";
export interface OpsTicket {
  id: string;
  ref: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "awaiting" | "resolved" | "escalated";
  priority: OpsPriority;
  assignee: string | null;
  /** hours until the response deadline (negative = overdue) */
  dueInHours: number;
  student: string;
  sensitive: string;
  messages: { id: string; at: string; who: "student" | "agent"; text: string }[];
  internal: { id: string; at: string; by: string; text: string }[];
}
const SUBJ = ["Selfie step keeps failing", "Payment failed but money left account", "Charges on my loan", "Cannot log in on new phone", "Late charge added by mistake", "Change my college", "KYC stuck in review", "Receipt not downloading"];
export const OPS_TICKETS: OpsTicket[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ot${i + 1}`,
  ref: `CMP-2026-${String(141 - i * 3).padStart(4, "0")}`,
  subject: SUBJ[i % 8],
  category: ["KYC", "Repayment", "Loan terms", "Account access", "Repayment", "Other", "KYC", "Repayment"][i % 8],
  status: (["open", "in_progress", "awaiting", "resolved", "escalated", "open"] as const)[i % 6],
  priority: (["normal", "high", "low", "urgent"] as const)[i % 4],
  assignee: i % 3 === 0 ? null : TEAM[i % 4],
  dueInHours: [6, -3, 20, 48, -26, 2][i % 6],
  student: `${FIRST[i]} (masked)`,
  sensitive: `Mobile +91 9${i}••• ••${10 + i}, ID ••••${2000 + i * 11}`,
  messages: [
    { id: "m1", at: iso(-3), who: "student", text: SUBJ[i % 8] + ". Please help." },
    { id: "m2", at: iso(-2), who: "agent", text: "Thanks for writing in. We are looking into this." },
  ],
  internal: i % 2 ? [{ id: "n1", at: iso(-2), by: TEAM[i % 4], text: "Checked the account. Nothing unusual. Waiting on the provider." }] : [],
}));

/* ---------------------------------------------------------------------- misc */
export interface AuditEntry {
  id: string;
  at: string;
  who: string;
  what: string;
  reason: string;
}
export const SEED_AUDIT: AuditEntry[] = [
  { id: "a1", at: iso(-1, 11), who: "Asha (placeholder), Reviewer", what: "Approved student verification APP-10429", reason: "V-OK Details match the ID" },
  { id: "a2", at: iso(-1, 13), who: "Ravi (placeholder), Fraud analyst", what: "Marked FRD-3305 as false positive", reason: "Two students shared a hostel device" },
  { id: "a3", at: iso(-2, 15), who: "Meera (placeholder), Support", what: "Assigned CMP-2026-0141 to self", reason: "Taking ownership" },
];

export const OPS_SERIES = Array.from({ length: 14 }, (_, i) => ({
  day: addDays(MOCK_TODAY, i - 13).toISOString().slice(5, 10),
  applications: [12, 15, 11, 18, 22, 19, 14, 17, 21, 25, 20, 23, 27, 24][i],
  turnaround: [26, 24, 28, 22, 20, 23, 25, 21, 19, 20, 18, 22, 17, 16][i],
}));
