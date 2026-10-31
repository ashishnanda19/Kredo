/**
 * Mock data for the student portal (auth, verification, KYC, loans, support, credit profile).
 * EVERYTHING here is fictional placeholder data. Identifiers are masked. Dates anchor to MOCK_TODAY.
 */
import { addDays, MOCK_TODAY } from "./format";

const iso = (days: number) => addDays(MOCK_TODAY, days).toISOString();
const isoDate = (days: number) => iso(days).slice(0, 10);

/* ----------------------------------------------------------------- colleges */
export const COLLEGES = [
  "Sunrise Institute of Technology, Pune",
  "Lakeview College of Arts, Kochi",
  "Northgate University, Delhi",
  "Riverbend Polytechnic, Lucknow",
  "St. Mary's Commerce College, Mumbai",
  "Hillcrest Engineering College, Bengaluru",
  "Greenfield Law School, Hyderabad",
  "Bayview Institute of Design, Chennai",
  "Maple Grove Science College, Jaipur",
  "Eastwind Institute of Management, Kolkata",
  "Silverline Women's College, Ahmedabad",
  "Crestview Medical College, Nagpur",
  "Oakridge Agricultural College, Ludhiana",
  "Harbor City Maritime Institute, Visakhapatnam",
  "Pinecrest College of Education, Bhopal",
  "Lotus Valley Pharmacy College, Indore",
  "Stonebridge Technical Institute, Coimbatore",
  "Meadowlark Arts and Science College, Mysuru",
  "Ironwood Institute of Architecture, Chandigarh",
  "Sapphire Coast University, Goa",
  "Tidewater College of Commerce, Surat",
  "Highland Institute of Technology, Dehradun",
  "Willow Creek Nursing College, Thiruvananthapuram",
  "Redwood Institute of Media, Noida",
  "Summit Peak Engineering College, Guwahati",
];

export const COURSES = ["B.Tech", "B.Sc", "B.Com", "BA", "BBA", "BCA", "B.Des", "B.Pharm", "LLB", "Diploma", "Other"];
export const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th year"];

/* --------------------------------------------------- verification reasons */
export type RejectionReason = "blurry_id" | "name_mismatch" | "id_expired" | "unreadable_back" | "college_unrecognised";

export const REJECTION: Record<RejectionReason, { label: string; why: string; fix: string; step: number; item: string }> = {
  blurry_id: {
    label: "ID photo is blurry",
    why: "We couldn't read the details on the front of your ID because the photo is out of focus.",
    fix: "Retake the front photo in good light, hold the phone steady, and keep all four corners in the frame.",
    step: 3,
    item: "Front of your college ID",
  },
  name_mismatch: {
    label: "Name does not match",
    why: "The name you entered does not match the name printed on your ID.",
    fix: "Check the spelling against your ID and correct the name, or upload a clearer photo if it was misread.",
    step: 2,
    item: "Full name as on ID",
  },
  id_expired: {
    label: "ID card has expired",
    why: "The validity date printed on your ID has passed.",
    fix: "Upload a current ID card, or a bonafide certificate from your college if your card is being renewed.",
    step: 3,
    item: "Front of your college ID (valid date)",
  },
  unreadable_back: {
    label: "Back of ID unreadable",
    why: "We couldn't read the back of your ID card.",
    fix: "Retake the back photo with no glare and all four corners visible.",
    step: 3,
    item: "Back of your college ID",
  },
  college_unrecognised: {
    label: "College not recognised",
    why: "We could not match the college on your ID with the college you selected.",
    fix: "Re-select your college, or use \"My college is not listed\" so we can review it.",
    step: 1,
    item: "College",
  },
};

export const EXPECTED_REVIEW = "usually within 1 to 2 working days (placeholder)";

/* ------------------------------------------------------------------- loans */
export interface LoanProduct {
  id: string;
  name: string;
  tagline: string;
  min: number;
  max: number;
  /** monthly charge as a percent of the principal, flat (placeholder) */
  chargePct: number;
  processingPct: number;
  tenures: number[];
  conditions: { id: "verified" | "kyc" | "age" | "score"; label: string; min?: number }[];
}

export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: "lp-starter",
    name: "Campus Starter",
    tagline: "A small amount for books, fees and the basics.",
    min: 1000,
    max: 3000,
    chargePct: 1.5,
    processingPct: 1,
    tenures: [2, 3],
    conditions: [
      { id: "verified", label: "Student verification accepted" },
      { id: "kyc", label: "KYC verified" },
    ],
  },
  {
    id: "lp-semester",
    name: "Semester Support",
    tagline: "Spread a bigger semester cost over a few months.",
    min: 2000,
    max: 7000,
    chargePct: 1.75,
    processingPct: 1.5,
    tenures: [3, 4, 6],
    conditions: [
      { id: "verified", label: "Student verification accepted" },
      { id: "kyc", label: "KYC verified" },
      { id: "age", label: "Account at least 30 days old", min: 30 },
    ],
  },
  {
    id: "lp-final",
    name: "Final Year Flex",
    tagline: "A higher amount with a longer repayment window.",
    min: 5000,
    max: 10000,
    chargePct: 2,
    processingPct: 2,
    tenures: [4, 6],
    conditions: [
      { id: "verified", label: "Student verification accepted" },
      { id: "kyc", label: "KYC verified" },
      { id: "age", label: "Account at least 90 days old", min: 90 },
      { id: "score", label: "Kredo internal score of 70 or more", min: 70 },
    ],
  },
];

export const LENDER = { name: "Placeholder Finance Ltd (regulated lending partner)", short: "Placeholder Finance" };
export const VERSIONS = { terms: "T-2026.1", offer: "O-2026.1", privacy: "P-2026.1", keyFacts: "K-2026.1" };

export const ACCOUNT_AGE_DAYS = 62;
export const INTERNAL_SCORE = 62;

export type AppStatus = "none" | "draft" | "submitted" | "assessment" | "more_info" | "offer_ready" | "accepted" | "declined";

export const APP_STATUS_ORDER: AppStatus[] = ["draft", "submitted", "assessment", "more_info", "offer_ready", "accepted", "declined"];

export const DECLINE_REASONS = [
  { code: "policy", label: "Does not meet lender policy for this product", next: "You can apply for a smaller amount or a different product after 30 days." },
  { code: "info", label: "Information could not be confirmed", next: "Check the details you gave and apply again, or contact support." },
];

export interface Instalment {
  n: number;
  dueDate: string;
  amount: number;
  principal: number;
  charges: number;
  state: "paid" | "due" | "upcoming" | "overdue";
}

/** Flat-charge schedule. Placeholder maths for the preview only. */
export function buildOffer(product: LoanProduct, amount: number, tenure: number) {
  const interest = Math.round((amount * product.chargePct * tenure) / 100);
  const processing = Math.round((amount * product.processingPct) / 100);
  const other = 0;
  const total = amount + interest + processing + other;
  const perMonth = Math.round((amount + interest) / tenure);
  const schedule: Instalment[] = Array.from({ length: tenure }, (_, i) => ({
    n: i + 1,
    dueDate: isoDate(30 * (i + 1)),
    amount: perMonth,
    principal: Math.round(amount / tenure),
    charges: perMonth - Math.round(amount / tenure),
    state: i === 0 ? "due" : "upcoming",
  }));
  return { productId: product.id, productName: product.name, amount, interest, processing, other, total, tenure, perMonth, schedule, lender: LENDER.name, version: VERSIONS.offer };
}
export type Offer = ReturnType<typeof buildOffer>;

export const EXTRA_INFO_REQUEST = {
  item: "A recent proof of pocket money or guardian-supported income",
  detail: "Upload nothing here. Tell us the monthly amount and the source, and our lending partner may ask for a document later.",
};

/* ------------------------------------------------------------- active loan */
export const ACTIVE_LOAN = {
  id: "LN-24017",
  product: "Semester Support",
  lender: LENDER.name,
  principal: 4000,
  tenure: 4,
  disbursedOn: isoDate(-45),
  acceptance: { at: iso(-46), offerVersion: VERSIONS.offer, termsVersion: VERSIONS.terms },
  fees: 40,
  penalties: 0,
  schedule: [
    { n: 1, dueDate: isoDate(-15), amount: 1070, principal: 1000, charges: 70, state: "paid" },
    { n: 2, dueDate: isoDate(3), amount: 1070, principal: 1000, charges: 70, state: "due" },
    { n: 3, dueDate: isoDate(33), amount: 1070, principal: 1000, charges: 70, state: "upcoming" },
    { n: 4, dueDate: isoDate(63), amount: 1070, principal: 1000, charges: 70, state: "upcoming" },
  ] as Instalment[],
};

/* ---------------------------------------------------------------- payments */
export type PayState = "pending" | "successful" | "failed" | "reversed";
export type PayMethod = "UPI" | "Netbanking" | "Debit card";

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PayMethod;
  state: PayState;
  loanId: string;
  instalment: number | null;
  reconciled: boolean;
  /** masked transaction reference */
  ref: string;
  note?: string;
}

export const PAYMENTS: PaymentRecord[] = [
  { id: "PAY-90112", date: iso(-15), amount: 1070, method: "UPI", state: "successful", loanId: "LN-24017", instalment: 1, reconciled: true, ref: "UPI••••4821" },
  { id: "PAY-90098", date: iso(-45), amount: 40, method: "UPI", state: "successful", loanId: "LN-24017", instalment: null, reconciled: true, ref: "UPI••••1107", note: "Processing fee" },
  { id: "PAY-90150", date: iso(-2), amount: 500, method: "UPI", state: "pending", loanId: "LN-24017", instalment: 2, reconciled: false, ref: "UPI••••6630", note: "Part payment, awaiting bank" },
  { id: "PAY-90133", date: iso(-8), amount: 1070, method: "Netbanking", state: "failed", loanId: "LN-24017", instalment: 2, reconciled: false, ref: "NB••••9027", note: "Bank declined the request" },
  { id: "PAY-90121", date: iso(-12), amount: 250, method: "UPI", state: "reversed", loanId: "LN-24017", instalment: 2, reconciled: true, ref: "UPI••••3350", note: "Reversed by the bank" },
  { id: "PAY-90077", date: iso(-60), amount: 120, method: "Debit card", state: "successful", loanId: "campus", instalment: null, reconciled: true, ref: "CARD••••0042", note: "Campus Cafe" },
  { id: "PAY-90071", date: iso(-62), amount: 85, method: "UPI", state: "successful", loanId: "campus", instalment: null, reconciled: false, ref: "UPI••••7712", note: "Annapurna Canteen" },
  { id: "PAY-90160", date: iso(-1), amount: 200, method: "UPI", state: "successful", loanId: "campus", instalment: null, reconciled: false, ref: "UPI••••5543", note: "Shree Stationery" },
  { id: "PAY-90166", date: iso(-1), amount: 65, method: "UPI", state: "failed", loanId: "campus", instalment: null, reconciled: false, ref: "UPI••••2204", note: "Timed out" },
  { id: "PAY-90170", date: iso(0), amount: 150, method: "UPI", state: "pending", loanId: "campus", instalment: null, reconciled: false, ref: "UPI••••8815", note: "Xerox Corner" },
];

export const PAY_STATE_INFO: Record<PayState, { label: string; why: string; next: string }> = {
  pending: { label: "Pending", why: "The bank has not confirmed this payment yet.", next: "Nothing to do. Most payments confirm within a few minutes, and some take up to a day." },
  successful: { label: "Successful", why: "The payment went through and was added to your loan.", next: "You can download the receipt." },
  failed: { label: "Failed", why: "The payment did not go through. No money was taken, or any amount taken will be returned by your bank.", next: "Try again, or pick a different payment method." },
  reversed: { label: "Reversed", why: "The bank returned this payment after it was made.", next: "The amount usually reaches your account in 5 to 7 working days (placeholder). Contact support if it takes longer." },
};

export const DISPUTE_CATEGORIES = ["Charged twice", "Amount is wrong", "Payment not shown", "I did not make this payment", "Other"];

/* ----------------------------------------------------------------- support */
export type TicketStatus = "open" | "in_progress" | "awaiting" | "resolved" | "escalated";
export type TicketCategory = "KYC" | "Repayment" | "Loan terms" | "Account access" | "Other";
export const TICKET_CATEGORIES: TicketCategory[] = ["KYC", "Repayment", "Loan terms", "Account access", "Other"];

export interface TicketEvent {
  id: string;
  at: string;
  who: "you" | "support" | "system";
  text: string;
  /** customer-visible */
  visible: boolean;
}
export interface Ticket {
  id: string;
  ref: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  events: TicketEvent[];
}

const ev = (id: string, d: number, who: TicketEvent["who"], text: string): TicketEvent => ({ id, at: iso(d), who, text, visible: true });

export const TICKETS: Ticket[] = [
  { id: "t1", ref: "CMP-2026-0141", subject: "Selfie step keeps failing", category: "KYC", status: "in_progress", createdAt: iso(-3), updatedAt: iso(-1), description: "The selfie step shows an error every time.", events: [ev("e1", -3, "you", "The selfie step shows an error every time."), ev("e2", -3, "system", "Ticket created. Reference CMP-2026-0141."), ev("e3", -1, "support", "Thanks. We have asked our verification partner to check this. We will update you within 2 working days.")] },
  { id: "t2", ref: "CMP-2026-0138", subject: "Payment shown as failed but money left my account", category: "Repayment", status: "awaiting", createdAt: iso(-8), updatedAt: iso(-2), description: "Netbanking payment failed but my balance dropped.", events: [ev("e1", -8, "you", "Netbanking payment failed but my balance dropped."), ev("e2", -2, "support", "Please share the last 4 digits of the bank reference from your SMS so we can match it.")] },
  { id: "t3", ref: "CMP-2026-0122", subject: "What are the charges on my loan?", category: "Loan terms", status: "resolved", createdAt: iso(-20), updatedAt: iso(-18), description: "I want a breakdown of the charges.", events: [ev("e1", -20, "you", "I want a breakdown of the charges."), ev("e2", -18, "support", "We have emailed the key fact summary. The charges are also listed on your loan page."), ev("e3", -18, "system", "Marked resolved.")] },
  { id: "t4", ref: "CMP-2026-0150", subject: "Cannot log in on my new phone", category: "Account access", status: "open", createdAt: iso(-1), updatedAt: iso(-1), description: "OTP is not arriving.", events: [ev("e1", -1, "you", "OTP is not arriving."), ev("e2", -1, "system", "Ticket created. Reference CMP-2026-0150.")] },
  { id: "t5", ref: "CMP-2026-0099", subject: "Late charge added by mistake", category: "Repayment", status: "escalated", createdAt: iso(-30), updatedAt: iso(-5), description: "A late charge was added although I paid on time.", events: [ev("e1", -30, "you", "A late charge was added although I paid on time."), ev("e2", -25, "support", "We are checking with the lender."), ev("e3", -5, "support", "This has been escalated to the lender grievance officer. They will respond within the timeline in the lender notice.")] },
  { id: "t6", ref: "CMP-2026-0155", subject: "Other: change my college", category: "Other", status: "open", createdAt: iso(0), updatedAt: iso(0), description: "I moved to a different college.", events: [ev("e1", 0, "you", "I moved to a different college."), ev("e2", 0, "system", "Ticket created. Reference CMP-2026-0155.")] },
];

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = { open: "Open", in_progress: "In progress", awaiting: "Awaiting you", resolved: "Resolved", escalated: "Escalated" };
export const RESPONSE_EXPECTATION = "We aim to reply within 2 working days. Complaints are acknowledged within 24 hours (placeholder timelines).";

export const GRIEVANCE_CARD = {
  lender: LENDER.name,
  officer: "Grievance Officer (placeholder)",
  email: "grievance@lender.example",
  phone: "+91 00000 00000 (placeholder)",
  escalation: "Step 1: raise a ticket here. Step 2: if unresolved in the stated time, write to the lender grievance officer. Step 3: you may escalate to the regulator as per its guidance (placeholder text).",
};

/* ----------------------------------------------------------- credit profile */
export const CREDIT_PROFILE = {
  score: INTERNAL_SCORE,
  factors: [
    { id: "f1", title: "Repaying on time", effect: "positive", why: "Your last 6 instalments and spends were repaid by the due date." },
    { id: "f2", title: "Using a small part of your limit", effect: "positive", why: "You use less than half of your available limit on average." },
    { id: "f3", title: "Account age", effect: "neutral", why: "Your account is 62 days old. Older accounts have more history to learn from." },
    { id: "f4", title: "One late repayment recorded", effect: "negative", why: "One payment on record was made after its due date." },
  ] as { id: string; title: string; effect: "positive" | "neutral" | "negative"; why: string }[],
  history: [
    { id: "h1", date: isoDate(-15), text: "Instalment 1 of 4 repaid on time", ok: true },
    { id: "h2", date: isoDate(-45), text: "Loan LN-24017 disbursed", ok: true },
    { id: "h3", date: isoDate(-52), text: "Campus spend repaid 2 days late", ok: false },
    { id: "h4", date: isoDate(-60), text: "Account opened", ok: true },
  ],
  reporting: "Not reported to bureaus (placeholder)",
};

/* --------------------------------------------------------------- consents */
export const CONSENT_PURPOSES = [
  { id: "identity", title: "Identity verification", purpose: "So our verification provider can confirm who you are and that you are a student. Needed to open your account.", required: true },
  { id: "credit", title: "Credit assessment", purpose: "So our lending partner can assess a loan request using the details you give us. Needed to apply for a loan.", required: false },
  { id: "comms", title: "Communication", purpose: "So we can send reminders and service messages about your account by SMS, email or app.", required: false },
] as const;
export type ConsentId = (typeof CONSENT_PURPOSES)[number]["id"];

export const DATA_REQUEST_TYPES = [
  { id: "access", label: "Request a copy of my data" },
  { id: "correction", label: "Correct my data" },
  { id: "deletion", label: "Delete my data" },
] as const;

/* ---------------------------------------------------- notification prefs */
export const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali"];
