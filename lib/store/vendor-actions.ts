"use client";

/**
 * Vendor onboarding steps that talk to the (mock) verification provider and then record the answer in the world.
 * The full account number never leaves the form: only the last four digits reach the world or the provider.
 */
import { getAdapters } from "../api";
import type { KycOutcome, PennyDropOutcome } from "../api/verification-provider";
import { acceptAgreement, recordVendorBank, recordVendorKyc, saveStallDetails, submitVendor, type StallDetails } from "../domain/vendors";
import { useWorld } from "./world";

const FALLBACK_PHONE = "+91 98••• ••210";

/** Creates the stall account on first save, or updates its details. Returns the vendor id. */
export function saveDetails(details: StallDetails): string {
  const s = useWorld.getState();
  const student = s.session.studentId ? s.world.students[s.session.studentId] : undefined;
  const phone = student ? s.world.accounts[student.accountId]?.phoneMasked ?? FALLBACK_PHONE : FALLBACK_PHONE;
  const existing = s.session.vendorId;
  const r = saveStallDetails(s.world, { vendorId: existing, details, phoneMasked: phone, studentId: s.session.studentId });
  s.apply(() => r.world);
  if (!existing) s.attachVendor(r.vendorId);
  return r.vendorId;
}

export async function submitKyc(vendorId: string, input: { idLast4: string; hasBusinessProof: boolean }): Promise<KycOutcome> {
  const { outcome } = await getAdapters().verification.submitKyc({ kind: "vendor", idMasked: `••••${input.idLast4}` });
  useWorld.getState().apply((w) => recordVendorKyc(w, vendorId, { ...input, outcome }));
  return outcome;
}

export async function checkBank(vendorId: string, input: { accountNumber: string; ifsc: string }): Promise<{ outcome: PennyDropOutcome; holderName?: string }> {
  const digits = input.accountNumber.replace(/\D/g, "");
  const accountLast4 = digits.slice(-4);
  const w = useWorld.getState().world;
  const v = w.vendors[vendorId];
  const res = await getAdapters().verification.pennyDrop({ bankMasked: `•••• ${accountLast4}`, ifsc: input.ifsc.trim().toUpperCase(), ownerName: v.ownerName, stallName: v.stallName });
  useWorld.getState().apply((cur) => recordVendorBank(cur, vendorId, { accountLast4, ifsc: input.ifsc, outcome: res.outcome, holderName: res.holderName }));
  return res;
}

export function agreeAndSubmit(vendorId: string) {
  useWorld.getState().apply((w) => submitVendor(acceptAgreement(w, vendorId), vendorId));
}
