"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MOCK_TODAY } from "@/lib/format";
import { ACTIVE_LOAN, buildOffer, LOAN_PRODUCTS, PAYMENTS, TICKETS, VERSIONS, type AppStatus, type ConsentId, type Offer, type PaymentRecord, type PayState, type RejectionReason, type Ticket } from "@/lib/mock-portal";
import { OPS_ROLES, SEED_AUDIT, type FraudOutcome, type FraudStatus, type OpsRole } from "@/lib/mock-ops";
import type { AuthEdge, DataRequest, Dispute, KycStatus, Loan, OpsDecision, PortalState, TimelineEvent, VerificationDraft, VerificationStatus, VerificationSummary } from "./types";

export const KYC_RETRY_LIMIT = 3;
export const OTP_ATTEMPT_LIMIT = 5;
export const VERIFY_ATTEMPT_SOFT_LIMIT = 3;

const now = () => new Date().toISOString();
let counter = 0;
const uid = (p = "id") => `${p}${Date.now().toString(36)}${(counter++).toString(36)}`;
/** Reference numbers: PREFIX-YYYY-NNNNNN. Fine in event handlers (never called during render). */
export const makeRef = (prefix: string) => `${prefix}-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;

export const emptyDraft = (): VerificationDraft => ({ college: "", collegeNotListed: false, requestedCollege: "", idNumber: "", fullName: "", course: "", year: "", email: "", dob: "" });

function initial(): PortalState {
  return {
    session: { loggedIn: false, mobile: "", edge: "none", otpAttempts: 0, timeoutWarning: false },
    profile: { displayName: "Aarav", language: "English", notif: { sms: true, email: false, push: true } },
    consents: { identity: null, credit: null, comms: null },
    verification: { status: "not_started", reason: null, attempts: 0, submittedAt: null, summary: null, timeline: [], celebrated: false, resumeStep: null, notListedRef: null },
    kyc: { status: "not_started", retries: 0, reference: null, maskedId: null },
    loanApp: { status: "none", productId: null, amount: 3000, tenure: 3, info: { range: "", source: "", obligations: "", reference: "" }, offer: null, acceptance: null, declineCode: null, moreInfoReply: null, submittedAt: null },
    loans: [],
    payments: { extra: [], stateOverride: {} },
    disputes: [],
    tickets: TICKETS,
    requests: [],
    ops: { role: "admin", audit: SEED_AUDIT, decisions: {}, fraud: {}, tickets: {}, reconFlags: {}, escalations: [], retries: {} },
    demo: { open: false, autoAccept: false, paymentOutcome: "successful" },
  };
}

interface Actions {
  /* auth */
  login: (maskedMobile: string) => void;
  logout: () => void;
  setEdge: (e: AuthEdge) => void;
  otpFail: () => void;
  otpReset: () => void;
  setTimeoutWarning: (v: boolean) => void;
  updateProfile: (p: Partial<PortalState["profile"]>) => void;
  /* consents */
  grantConsent: (id: ConsentId) => void;
  withdrawConsent: (id: ConsentId) => void;
  /* verification */
  draft: VerificationDraft;
  setDraft: (d: Partial<VerificationDraft>) => void;
  submitVerification: (summary: VerificationSummary, notListed?: boolean) => void;
  setVerification: (status: VerificationStatus, reason?: RejectionReason | null) => void;
  markCelebrated: () => void;
  startResubmit: () => void;
  /* kyc */
  setKyc: (s: KycStatus, extra?: Partial<PortalState["kyc"]>) => void;
  /* loan */
  setLoanDraft: (p: Partial<PortalState["loanApp"]>) => void;
  submitApplication: () => void;
  setLoanStatus: (s: AppStatus) => void;
  replyMoreInfo: (text: string) => void;
  acceptOffer: () => void;
  resetApplication: () => void;
  /* payments, disputes, support, requests */
  recordPayment: (p: Omit<PaymentRecord, "id" | "date">, markInstalment?: { loanId: string; n: number }) => PaymentRecord;
  setPaymentOutcome: (s: PayState) => void;
  addDispute: (d: Omit<Dispute, "ref" | "status" | "at">) => Dispute;
  addTicket: (t: Pick<Ticket, "subject" | "category" | "description">) => Ticket;
  replyTicket: (id: string, text: string) => void;
  addRequest: (type: DataRequest["type"], detail: string) => DataRequest;
  /* ops */
  setRole: (r: OpsRole) => void;
  audit: (what: string, reason: string) => void;
  decide: (appId: string, d: Pick<OpsDecision, "status" | "code" | "note">) => void;
  fraudUpdate: (id: string, patch: { status?: FraudStatus; outcome?: FraudOutcome; note?: string }) => void;
  opsTicket: (id: string, patch: Partial<{ status: "open" | "in_progress" | "awaiting" | "resolved" | "escalated"; assignee: string | null; priority: "low" | "normal" | "high" | "urgent" }>, note?: string) => void;
  opsReply: (id: string, kind: "customer" | "internal", text: string) => void;
  flagRecon: (id: string) => void;
  escalate: (target: string, summary: string) => string;
  retryEvent: (id: string, note: string) => void;
  /* demo */
  setDemoOpen: (v: boolean) => void;
  setAutoAccept: (v: boolean) => void;
  applyPreset: (p: "fresh" | "new_student" | "verified" | "verified_loan") => void;
  resetAll: () => void;
}

export type Store = PortalState & Actions;

const tl = (title: string, detail?: string): TimelineEvent => ({ id: uid("tl"), at: now(), title, detail });

function loanFromOffer(offer: Offer): Loan {
  return {
    id: `LN-${String(24100 + Math.floor(Math.random() * 800))}`,
    product: offer.productName,
    lender: offer.lender,
    principal: offer.amount,
    tenure: offer.tenure,
    disbursedOn: MOCK_TODAY.toISOString().slice(0, 10),
    acceptance: { at: now(), offerVersion: offer.version, termsVersion: VERSIONS.terms },
    fees: offer.processing + offer.other,
    penalties: 0,
    schedule: offer.schedule,
  };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial(),
      draft: emptyDraft(),

      login: (mobile) => set((s) => ({ session: { ...s.session, loggedIn: true, mobile, edge: "none", otpAttempts: 0 } })),
      logout: () => set((s) => ({ session: { ...s.session, loggedIn: false, edge: "none", timeoutWarning: false } })),
      setEdge: (edge) => set((s) => ({ session: { ...s.session, edge } })),
      otpFail: () => set((s) => ({ session: { ...s.session, otpAttempts: s.session.otpAttempts + 1, edge: s.session.otpAttempts + 1 >= OTP_ATTEMPT_LIMIT ? "locked" : s.session.edge } })),
      otpReset: () => set((s) => ({ session: { ...s.session, otpAttempts: 0 } })),
      setTimeoutWarning: (v) => set((s) => ({ session: { ...s.session, timeoutWarning: v } })),
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      grantConsent: (id) => set((s) => ({ consents: { ...s.consents, [id]: { granted: true, at: now(), version: VERSIONS.privacy } } })),
      withdrawConsent: (id) => set((s) => ({ consents: { ...s.consents, [id]: { granted: false, at: now(), version: VERSIONS.privacy } } })),

      setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
      submitVerification: (summary, notListed) =>
        set((s) => ({
          verification: {
            ...s.verification,
            status: "pending",
            reason: null,
            attempts: s.verification.attempts + 1,
            submittedAt: now(),
            summary,
            resumeStep: null,
            celebrated: false,
            notListedRef: notListed ? makeRef("COL") : s.verification.notListedRef,
            timeline: [...s.verification.timeline, tl("Submitted for review", `Attempt ${s.verification.attempts + 1}`)],
          },
        })),
      setVerification: (status, reason = null) =>
        set((s) => {
          const titles: Record<VerificationStatus, string> = {
            not_started: "Verification reset",
            pending: "Pending review",
            accepted: "Verification accepted",
            rejected: "Verification not accepted",
            expired: "Verification expired",
            resubmission: "Resubmission required",
          };
          return {
            verification: {
              ...s.verification,
              status,
              reason: status === "rejected" || status === "resubmission" ? reason ?? s.verification.reason ?? "blurry_id" : null,
              attempts: status === "not_started" ? 0 : Math.max(s.verification.attempts, 1),
              celebrated: status === "accepted" ? s.verification.celebrated : false,
              timeline: status === "not_started" ? [] : [...s.verification.timeline, tl(titles[status], reason ? `Reason: ${reason}` : undefined)],
            },
          };
        }),
      markCelebrated: () => set((s) => ({ verification: { ...s.verification, celebrated: true } })),
      startResubmit: () => set((s) => ({ verification: { ...s.verification, resumeStep: s.verification.reason ? ({ blurry_id: 3, name_mismatch: 2, id_expired: 3, unreadable_back: 3, college_unrecognised: 1 } as const)[s.verification.reason] : 1 } })),

      setKyc: (status, extra) => set((s) => ({ kyc: { ...s.kyc, status, ...extra } })),

      setLoanDraft: (p) => set((s) => ({ loanApp: { ...s.loanApp, ...p } })),
      submitApplication: () =>
        set((s) => ({ loanApp: { ...s.loanApp, status: "submitted", submittedAt: now() } })),
      setLoanStatus: (status) => {
        set((s) => {
          const product = LOAN_PRODUCTS.find((p) => p.id === s.loanApp.productId) ?? LOAN_PRODUCTS[0];
          const offer = status === "offer_ready" || status === "accepted" ? s.loanApp.offer ?? buildOffer(product, s.loanApp.amount, s.loanApp.tenure) : s.loanApp.offer;
          return { loanApp: { ...s.loanApp, status, offer, declineCode: status === "declined" ? s.loanApp.declineCode ?? "policy" : null } };
        });
        if (status === "accepted" && !get().loanApp.acceptance) get().acceptOffer();
      },
      // (an accepted status from the demo panel also creates the loan + acceptance record)
      replyMoreInfo: (text) => set((s) => ({ loanApp: { ...s.loanApp, moreInfoReply: text, status: "assessment" } })),
      acceptOffer: () => {
        const { loanApp } = get();
        if (!loanApp.offer) return;
        const loan = loanFromOffer(loanApp.offer);
        set((s) => ({
          loans: [...s.loans, loan],
          loanApp: { ...s.loanApp, status: "accepted", acceptance: { ...loan.acceptance, loanId: loan.id } },
        }));
      },
      resetApplication: () => set((s) => ({ loanApp: initial().loanApp, draft: s.draft })),

      recordPayment: (p, mark) => {
        const rec: PaymentRecord = { ...p, id: `PAY-${91000 + get().payments.extra.length + 1}`, date: now() };
        set((s) => ({
          payments: { ...s.payments, extra: [rec, ...s.payments.extra] },
          loans:
            mark && p.state === "successful"
              ? s.loans.map((l) =>
                  l.id === mark.loanId
                    ? {
                        ...l,
                        schedule: l.schedule.map((i, idx, arr) => {
                          if (i.n === mark.n) return { ...i, state: "paid" as const };
                          // promote the next unpaid instalment to "due"
                          const prevPaid = arr.slice(0, idx).every((x) => x.n === mark.n || x.state === "paid");
                          return i.state === "upcoming" && prevPaid && idx === arr.findIndex((x) => x.n !== mark.n && x.state !== "paid") ? { ...i, state: "due" as const } : i;
                        }),
                      }
                    : l,
                )
              : s.loans,
        }));
        return rec;
      },
      setPaymentOutcome: (paymentOutcome) => set((s) => ({ demo: { ...s.demo, paymentOutcome } })),
      addDispute: (d) => {
        const dispute: Dispute = { ...d, ref: makeRef("DSP"), status: "Raised", at: now() };
        set((s) => ({ disputes: [dispute, ...s.disputes] }));
        return dispute;
      },
      addTicket: (t) => {
        const ref = makeRef("CMP");
        const ticket: Ticket = {
          id: uid("t"),
          ref,
          subject: t.subject,
          category: t.category,
          description: t.description,
          status: "open",
          createdAt: now(),
          updatedAt: now(),
          events: [
            { id: uid("e"), at: now(), who: "you", text: t.description, visible: true },
            { id: uid("e"), at: now(), who: "system", text: `Ticket created. Reference ${ref}.`, visible: true },
          ],
        };
        set((s) => ({ tickets: [ticket, ...s.tickets] }));
        return ticket;
      },
      replyTicket: (id, text) =>
        set((s) => ({
          tickets: s.tickets.map((t) => (t.id === id ? { ...t, status: t.status === "awaiting" ? "in_progress" : t.status, updatedAt: now(), events: [...t.events, { id: uid("e"), at: now(), who: "you", text, visible: true }] } : t)),
        })),
      addRequest: (type, detail) => {
        const r: DataRequest = { ref: makeRef(type === "credit_correction" ? "CRC" : "DPR"), type, detail, at: now(), status: "Received" };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },

      setRole: (role) => set((s) => ({ ops: { ...s.ops, role } })),
      audit: (what, reason) =>
        set((s) => {
          const role = OPS_ROLES.find((r) => r.id === s.ops.role)?.label ?? s.ops.role;
          return { ops: { ...s.ops, audit: [{ id: uid("a"), at: now(), who: `You (demo), ${role}`, what, reason }, ...s.ops.audit] } };
        }),
      decide: (appId, d) => {
        const role = OPS_ROLES.find((r) => r.id === get().ops.role)?.label ?? "";
        set((s) => ({ ops: { ...s.ops, decisions: { ...s.ops.decisions, [appId]: { ...d, by: `You (demo), ${role}`, at: now() } } } }));
        get().audit(`${d.status.replace("_", " ")} for ${appId}`, `${d.code}${d.note ? `: ${d.note}` : ""}`);
      },
      fraudUpdate: (id, patch) => {
        set((s) => {
          const cur = s.ops.fraud[id] ?? { status: "open" as FraudStatus, outcome: null, notes: [] };
          return {
            ops: {
              ...s.ops,
              fraud: {
                ...s.ops.fraud,
                [id]: {
                  status: patch.status ?? cur.status,
                  outcome: patch.outcome === undefined ? cur.outcome : patch.outcome,
                  notes: patch.note ? [...cur.notes, { by: "You (demo)", at: now(), text: patch.note }] : cur.notes,
                },
              },
            },
          };
        });
        get().audit(`Fraud alert ${id}: ${patch.outcome ? `outcome ${patch.outcome}` : patch.status ?? "note added"}`, patch.note ?? "Analyst action");
      },
      opsTicket: (id, patch, note) => {
        set((s) => {
          const cur = s.ops.tickets[id] ?? { messages: [], internal: [], history: [] };
          return { ops: { ...s.ops, tickets: { ...s.ops.tickets, [id]: { ...cur, ...patch, history: [...cur.history, { id: uid("h"), at: now(), by: "You (demo)", text: Object.entries(patch).map(([k, v]) => `${k} set to ${String(v)}`).join(", ") }] } } } };
        });
        get().audit(`Ticket ${id}: ${Object.entries(patch).map(([k, v]) => `${k}=${String(v)}`).join(", ")}`, note ?? "Support action");
      },
      opsReply: (id, kind, text) => {
        set((s) => {
          const cur = s.ops.tickets[id] ?? { messages: [], internal: [], history: [] };
          const next =
            kind === "customer"
              ? { ...cur, messages: [...cur.messages, { id: uid("m"), at: now(), who: "agent" as const, text }], history: [...cur.history, { id: uid("h"), at: now(), by: "You (demo)", text: "Customer reply sent" }] }
              : { ...cur, internal: [...cur.internal, { id: uid("n"), at: now(), by: "You (demo)", text }], history: [...cur.history, { id: uid("h"), at: now(), by: "You (demo)", text: "Internal note added" }] };
          return { ops: { ...s.ops, tickets: { ...s.ops.tickets, [id]: next } } };
        });
        get().audit(`Ticket ${id}: ${kind === "customer" ? "customer reply" : "internal note"}`, kind === "customer" ? "Reply" : "Note");
      },
      flagRecon: (id) => {
        set((s) => ({ ops: { ...s.ops, reconFlags: { ...s.ops.reconFlags, [id]: true } } }));
        get().audit(`Flagged reconciliation record ${id}`, "Mismatch needs review");
      },
      escalate: (target, summary) => {
        const ref = makeRef("ESC");
        set((s) => ({ ops: { ...s.ops, escalations: [{ ref, target, summary, at: now() }, ...s.ops.escalations] } }));
        get().audit(`Escalated discrepancy to ${target} (${ref})`, summary);
        return ref;
      },
      retryEvent: (id, note) => {
        set((s) => ({ ops: { ...s.ops, retries: { ...s.ops.retries, [id]: note } } }));
        get().audit(`Retry noted for ${id}`, note);
      },

      setDemoOpen: (open) => set((s) => ({ demo: { ...s.demo, open } })),
      setAutoAccept: (autoAccept) => set((s) => ({ demo: { ...s.demo, autoAccept } })),
      applyPreset: (p) => {
        const base = initial();
        const demo = get().demo;
        const ops = { ...base.ops, role: get().ops.role };
        const stamp = { granted: true, at: now(), version: VERSIONS.privacy };
        const loggedIn = { ...base.session, loggedIn: true, mobile: "+91 98••• ••210" };
        const verified = { ...base.verification, status: "accepted" as const, attempts: 1, celebrated: true, submittedAt: now(), summary: { college: "Sunrise Institute of Technology, Pune", fullName: "Aarav Sharma", course: "B.Tech", year: "2nd year", idMasked: "••••2041", hasFront: true, hasBack: true }, timeline: [{ id: uid("tl"), at: now(), title: "Verification accepted" }] };
        const kycOk = { status: "verified" as const, retries: 0, reference: null, maskedId: "••••••••4821" };
        const consents = { identity: stamp, credit: stamp, comms: stamp };
        if (p === "fresh") set({ ...base, ops, demo });
        if (p === "new_student") set({ ...base, ops, demo, session: loggedIn });
        if (p === "verified") set({ ...base, ops, demo, session: loggedIn, verification: verified, kyc: kycOk, consents });
        if (p === "verified_loan")
          set({
            ...base,
            ops,
            demo,
            session: loggedIn,
            verification: verified,
            kyc: kycOk,
            consents,
            loans: [{ ...ACTIVE_LOAN, schedule: ACTIVE_LOAN.schedule.map((i) => ({ ...i })) } as Loan],
            loanApp: { ...base.loanApp, status: "accepted", productId: "lp-semester", amount: 4000, tenure: 4, offer: buildOffer(LOAN_PRODUCTS[1], 4000, 4), acceptance: { ...ACTIVE_LOAN.acceptance, loanId: ACTIVE_LOAN.id } },
            payments: { extra: [], stateOverride: {} },
          });
        set({ draft: emptyDraft() });
      },
      resetAll: () => {
        set({ ...initial(), draft: emptyDraft() });
        try {
          localStorage.removeItem("kredo-demo-state");
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "kredo-demo-state",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Persist status flags only. The draft (may hold an identity number) is NEVER persisted,
      // and ID photos never reach the store at all.
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { draft, ...rest } = s;
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== "function") data[k] = v;
        // the demo panel itself always starts closed after a reload
        data.demo = { ...(rest.demo as object), open: false };
        return data as unknown as Store;
      },
    },
  ),
);

/** Merge payments (seed + created) with demo state overrides. */
export function allPayments(extra: PaymentRecord[]): PaymentRecord[] {
  return [...extra, ...PAYMENTS];
}

export function outstandingOf(loan: Loan) {
  const open = loan.schedule.filter((i) => i.state !== "paid");
  const principal = open.reduce((s, i) => s + i.principal, 0);
  const interest = open.reduce((s, i) => s + i.charges, 0);
  const fees = loan.fees;
  const penalties = loan.penalties;
  return { principal, interest, fees, penalties, total: principal + interest + fees + penalties };
}

export function nextInstalment(loan: Loan) {
  return loan.schedule.find((i) => i.state === "due" || i.state === "overdue") ?? loan.schedule.find((i) => i.state === "upcoming") ?? null;
}

/** True once the persisted state has been loaded from localStorage (avoids SSR/CSR mismatches). */
export function useHydrated() {
  // rehydrate once on the client; the store snapshot flips when persisted state has loaded
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) void useStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

export const isVerified = (s: Pick<Store, "verification">) => s.verification.status === "accepted";
