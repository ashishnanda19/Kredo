/**
 * Vendor accounts: onboarding, the review decision, suspension and the stall QR. Pure functions over the world, like
 * the ledger reducers. A vendor is a SEPARATE account from any student, even when the same person owns both; the two
 * share only a device link, which is what lets the pay flow block a student paying their own stall.
 *
 * Only masked values are ever kept (last four digits). Photos are placeholders and nothing is uploaded.
 */
import { produce, type Draft } from "immer";
import { appendAudit } from "./audit";
import { DomainError } from "./world";
import { getPolicy } from "../policy";
import type { Account, VendorCategory, VendorOnboarding, VendorProfile, WorldState } from "./types";

export const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "food", label: "Food and drink" },
  { value: "print", label: "Print and copy" },
  { value: "stationery", label: "Stationery and books" },
  { value: "laundry", label: "Laundry" },
  { value: "other", label: "Something else" },
];

export interface StallDetails {
  ownerName: string;
  stallName: string;
  category: VendorCategory;
  campusArea: string;
  hours: string;
}

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const isIfsc = (x: string) => IFSC.test(x.trim().toUpperCase());

/** The ways a stall detail can be wrong, as field-level messages. Empty means valid. */
export function validateDetails(d: StallDetails): Partial<Record<keyof StallDetails, string>> {
  const e: Partial<Record<keyof StallDetails, string>> = {};
  if (d.ownerName.trim().length < 2) e.ownerName = "Enter the owner's name.";
  if (d.stallName.trim().length < 2) e.stallName = "Enter your stall's name.";
  if (!CATEGORIES.some((c) => c.value === d.category)) e.category = "Choose what you sell.";
  if (d.campusArea.trim().length < 2) e.campusArea = "Say where on campus you are, for example Main gate.";
  if (d.hours.trim().length < 3) e.hours = "Enter your opening hours, for example 9am to 6pm.";
  return e;
}

const seqOf = (d: Draft<WorldState>) => ++d.seq;
function audit(d: Draft<WorldState>, at: number, actor: string, action: string, target: string, details: Record<string, string | number | boolean> = {}) {
  d.audit = appendAudit(d.audit, { at, actor, action, target, details }, seqOf(d));
}

const vendorOf = (d: Draft<WorldState> | WorldState, id: string): VendorProfile => {
  const v = d.vendors[id];
  if (!v) throw new DomainError("UNKNOWN_VENDOR", "That stall does not exist.");
  return v;
};
const onboardingOf = (v: Draft<VendorProfile>): VendorOnboarding => (v.onboarding ??= { kyc: "none", hasBusinessProof: false, bank: "none" });

const capFor = (level: "full" | "light") => (level === "full" ? getPolicy().vendor.dailyCapCoins.full : getPolicy().vendor.dailyCapCoins.light);

/** The stall can take payments: accepted AND its bank account is verified. The QR works only then. */
export const isVendorActive = (v: VendorProfile | undefined): boolean => !!v && v.status === "accepted" && v.bankVerified;

/**
 * Creates the vendor account (status not_started) or updates its details while onboarding. `deviceLinkId` ties the
 * stall to the same person's student account, when there is one. Returns the vendor id.
 */
export function saveStallDetails(world: WorldState, input: { vendorId?: string | null; details: StallDetails; phoneMasked: string; studentId?: string | null; at?: number }): { world: WorldState; vendorId: string } {
  const errs = validateDetails(input.details);
  if (Object.keys(errs).length) throw new DomainError("BAD_DETAILS", Object.values(errs)[0]);
  let vendorId = input.vendorId ?? "";
  const next = produce(world, (d) => {
    const at = input.at ?? d.clock.now;
    const det = { ...input.details, ownerName: input.details.ownerName.trim(), stallName: input.details.stallName.trim(), campusArea: input.details.campusArea.trim(), hours: input.details.hours.trim() };
    if (vendorId) {
      const v = vendorOf(d, vendorId);
      if (v.status === "pending" || v.status === "accepted" || v.status === "suspended") throw new DomainError("LOCKED", "These details can't be changed right now.");
      Object.assign(v, det);
      d.accounts[v.accountId].displayName = det.stallName;
      audit(d, at, vendorId, "vendor.details_saved", vendorId);
      return;
    }
    vendorId = `ven-${String(seqOf(d)).padStart(4, "0")}`;
    const accountId = `acct-${vendorId}`;
    // the same person's student account and stall share a device link: that is what blocks paying your own stall
    let deviceLinkId: string | undefined;
    const studentAccount = input.studentId ? d.accounts[d.students[input.studentId]?.accountId ?? ""] : undefined;
    if (studentAccount) deviceLinkId = studentAccount.deviceLinkId ??= `dev-${input.studentId}`;
    const account: Account = { id: accountId, role: "vendor", displayName: det.stallName, phoneMasked: input.phoneMasked, status: "not_started", ...(deviceLinkId ? { deviceLinkId } : {}), createdAt: at };
    d.accounts[accountId] = account;
    d.vendors[vendorId] = {
      accountId, ...det, bankMasked: "", bankVerified: false, verificationLevel: "light", dailyCap: capFor("light"), qrVersion: 1, status: "not_started",
      onboarding: { kyc: "none", hasBusinessProof: false, bank: "none" },
    };
    audit(d, at, vendorId, "vendor.account_created", vendorId);
  });
  return { world: next, vendorId };
}

/** Records the KYC outcome. A stall with a business proof is "full" (higher daily cap); without one it is "light". */
export function recordVendorKyc(world: WorldState, vendorId: string, input: { idLast4: string; hasBusinessProof: boolean; outcome: "verified" | "needs_retry" | "provider_error"; at?: number }): WorldState {
  if (!/^\d{4}$/.test(input.idLast4)) throw new DomainError("BAD_ID", "Enter the last four digits of your ID.");
  return produce(world, (d) => {
    const at = input.at ?? d.clock.now;
    const v = vendorOf(d, vendorId);
    const o = onboardingOf(v);
    o.hasBusinessProof = input.hasBusinessProof;
    if (input.outcome === "verified") {
      o.kyc = "verified";
      o.idMasked = `••••${input.idLast4}`;
      v.verificationLevel = input.hasBusinessProof ? "full" : "light";
      v.dailyCap = capFor(v.verificationLevel);
    } else o.kyc = "none";
    audit(d, at, vendorId, "vendor.kyc", vendorId, { outcome: input.outcome, level: v.verificationLevel });
  });
}

/** Records the penny-drop result. Only a success marks the bank account verified. */
export function recordVendorBank(world: WorldState, vendorId: string, input: { accountLast4: string; ifsc: string; outcome: "success" | "name_mismatch" | "provider_error"; holderName?: string; at?: number }): WorldState {
  if (!/^\d{4}$/.test(input.accountLast4)) throw new DomainError("BAD_ACCOUNT", "Enter a valid account number.");
  if (!isIfsc(input.ifsc)) throw new DomainError("BAD_IFSC", "Enter a valid IFSC, for example HDFC0001234.");
  return produce(world, (d) => {
    const at = input.at ?? d.clock.now;
    const v = vendorOf(d, vendorId);
    const o = onboardingOf(v);
    o.ifsc = input.ifsc.trim().toUpperCase();
    o.bank = input.outcome === "success" ? "verified" : input.outcome;
    o.bankHolderSeen = input.outcome === "name_mismatch" ? input.holderName : undefined;
    v.bankVerified = input.outcome === "success";
    v.bankMasked = `•••• ${input.accountLast4}`;
    audit(d, at, vendorId, "vendor.bank_check", vendorId, { outcome: input.outcome });
  });
}

/** Marks the vendor agreement as accepted. Needs KYC and a verified bank account first. */
export function acceptAgreement(world: WorldState, vendorId: string, at?: number): WorldState {
  const v = vendorOf(world, vendorId);
  if (v.onboarding?.kyc !== "verified") throw new DomainError("KYC_FIRST", "Finish the ID check first.");
  if (!v.bankVerified) throw new DomainError("BANK_FIRST", "Verify your bank account first.");
  return produce(world, (d) => {
    const t = at ?? d.clock.now;
    onboardingOf(vendorOf(d, vendorId)).agreedAt = t;
    audit(d, t, vendorId, "vendor.agreement_accepted", vendorId);
  });
}

/** Sends the application to review. Allowed once, then again only after a rejection or a resubmission request. */
export function submitVendor(world: WorldState, vendorId: string, at?: number): WorldState {
  const v = vendorOf(world, vendorId);
  if (v.status === "pending") return world; // idempotent
  if (v.status !== "not_started" && v.status !== "rejected" && v.status !== "resubmission") throw new DomainError("BAD_STATE", "This application can't be submitted now.");
  if (!v.onboarding?.agreedAt || v.onboarding.kyc !== "verified" || !v.bankVerified) throw new DomainError("INCOMPLETE", "Finish every step before submitting.");
  return produce(world, (d) => {
    const t = at ?? d.clock.now;
    const dv = vendorOf(d, vendorId);
    dv.status = "pending";
    d.accounts[dv.accountId].status = "pending";
    onboardingOf(dv).submittedAt = t;
    onboardingOf(dv).reason = undefined;
    audit(d, t, vendorId, "vendor.submitted", vendorId);
  });
}

export type VendorDecision = "accept" | "reject" | "resubmit";

/** The review decision. Only a pending application can be decided. Accepting needs a verified bank account. */
export function decideVendor(world: WorldState, vendorId: string, decision: VendorDecision, actor: string, reason?: string, at?: number): WorldState {
  const v = vendorOf(world, vendorId);
  if (v.status !== "pending") throw new DomainError("NOT_PENDING", "Only an application waiting for review can be decided.");
  if (decision === "accept" && !v.bankVerified) throw new DomainError("BANK_NOT_VERIFIED", "The bank account is not verified yet, so the stall can't be accepted.");
  if (decision !== "accept" && !reason?.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason so the owner knows what to fix.");
  return produce(world, (d) => {
    const t = at ?? d.clock.now;
    const dv = vendorOf(d, vendorId);
    const status = decision === "accept" ? "accepted" : decision === "reject" ? "rejected" : "resubmission";
    dv.status = status;
    d.accounts[dv.accountId].status = status;
    const o = onboardingOf(dv);
    o.decidedAt = t;
    o.reason = decision === "accept" ? undefined : reason!.trim();
    audit(d, t, actor, `vendor.${decision === "accept" ? "accepted" : decision === "reject" ? "rejected" : "resubmission_requested"}`, vendorId, { reason: o.reason ?? "" });
  });
}

/** Ops: stop a stall taking payments (its QR is then rejected), or let it take them again. */
export function setVendorSuspended(world: WorldState, vendorId: string, suspended: boolean, actor: string, reason: string, at?: number): WorldState {
  const v = vendorOf(world, vendorId);
  if (!reason.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason. It is written to the audit log.");
  if (suspended && v.status !== "accepted") throw new DomainError("BAD_STATE", "Only an active stall can be suspended.");
  if (!suspended && v.status !== "suspended") throw new DomainError("BAD_STATE", "That stall is not suspended.");
  return produce(world, (d) => {
    const t = at ?? d.clock.now;
    const dv = vendorOf(d, vendorId);
    dv.status = suspended ? "suspended" : "accepted";
    d.accounts[dv.accountId].status = dv.status;
    audit(d, t, actor, suspended ? "vendor.suspended" : "vendor.reinstated", vendorId, { reason: reason.trim() });
  });
}

/** Issues a new QR and revokes the old one: scanning an older version is refused. */
export function regenerateQr(world: WorldState, vendorId: string, actor: string, at?: number): WorldState {
  const v = vendorOf(world, vendorId);
  if (!isVendorActive(v)) throw new DomainError("NOT_ACTIVE", "A QR is available once the stall is accepted and its bank account is verified.");
  return produce(world, (d) => {
    const dv = vendorOf(d, vendorId);
    dv.qrVersion += 1;
    audit(d, at ?? d.clock.now, actor, "vendor.qr_regenerated", vendorId, { version: dv.qrVersion });
  });
}

/** Which onboarding step a stall should be sent to next. */
export function nextOnboardingStep(v: VendorProfile | undefined): "details" | "kyc" | "bank" | "agreement" | "status" {
  if (!v) return "details";
  if (v.status !== "not_started") return "status";
  if (v.onboarding?.kyc !== "verified") return "kyc";
  if (!v.bankVerified) return "bank";
  return "agreement";
}
