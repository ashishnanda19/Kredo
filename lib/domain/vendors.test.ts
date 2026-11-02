import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "../demo/seed";
import { checkQr, qrPayload } from "../qr";
import { DomainError } from "./world";
import { acceptAgreement, decideVendor, nextOnboardingStep, recordVendorBank, recordVendorKyc, regenerateQr, saveStallDetails, setVendorSuspended, submitVendor, validateDetails } from "./vendors";
import type { WorldState } from "./types";

const SEEDED = buildSeedWorld();
const DETAILS = { ownerName: "Nisha Rao", stallName: "Nisha's Rolls", category: "food" as const, campusArea: "Main gate", hours: "9am to 6pm" };

function created(w: WorldState = SEEDED, studentId: string | null = null) {
  return saveStallDetails(w, { details: DETAILS, phoneMasked: "+91 98••• ••210", studentId });
}
function verified(w: WorldState, id: string, proof = true) {
  let x = recordVendorKyc(w, id, { idLast4: "4821", hasBusinessProof: proof, outcome: "verified" });
  x = recordVendorBank(x, id, { accountLast4: "9034", ifsc: "hdfc0001234", outcome: "success" });
  return x;
}

describe("vendor onboarding", () => {
  it("validates stall details with plain field messages", () => {
    expect(validateDetails({ ownerName: "", stallName: "", category: "food", campusArea: "", hours: "" })).toMatchObject({ ownerName: expect.any(String), stallName: expect.any(String), campusArea: expect.any(String), hours: expect.any(String) });
    expect(validateDetails(DETAILS)).toEqual({});
  });
  it("creates a separate vendor account that starts not_started and unverified", () => {
    const { world, vendorId } = created();
    const v = world.vendors[vendorId];
    expect(v.status).toBe("not_started");
    expect(v.bankVerified).toBe(false);
    expect(world.accounts[v.accountId].role).toBe("vendor");
    expect(nextOnboardingStep(v)).toBe("kyc");
  });
  it("links a student's stall to the same device, which is what blocks self-pay later", () => {
    const { world, vendorId } = created(SEEDED, "stu-diya");
    const stu = world.accounts[world.students["stu-diya"].accountId];
    expect(stu.deviceLinkId).toBeDefined();
    expect(world.accounts[world.vendors[vendorId].accountId].deviceLinkId).toBe(stu.deviceLinkId);
  });
  it("keeps only the last four digits of the ID and the account", () => {
    const { world, vendorId } = created();
    const w = verified(world, vendorId);
    expect(w.vendors[vendorId].onboarding?.idMasked).toBe("••••4821");
    expect(w.vendors[vendorId].bankMasked).toBe("•••• 9034");
    expect(JSON.stringify(w.vendors[vendorId])).not.toMatch(/\d{9,}/);
  });
  it("a small stall with no registration gets the lower daily cap", () => {
    const { world, vendorId } = created();
    const light = verified(world, vendorId, false).vendors[vendorId];
    const full = verified(world, vendorId, true).vendors[vendorId];
    expect(light.verificationLevel).toBe("light");
    expect(full.verificationLevel).toBe("full");
    expect(light.dailyCap).toBeLessThan(full.dailyCap);
  });
  it("penny-drop: a name mismatch or provider error leaves the bank unverified", () => {
    const { world, vendorId } = created();
    for (const outcome of ["name_mismatch", "provider_error"] as const) {
      const w = recordVendorBank(world, vendorId, { accountLast4: "1111", ifsc: "SBIN0000123", outcome, holderName: "A. N. Other" });
      expect(w.vendors[vendorId].bankVerified).toBe(false);
      expect(() => acceptAgreement(w, vendorId)).toThrow(DomainError);
    }
  });
  it("rejects a bad IFSC or ID digits", () => {
    const { world, vendorId } = created();
    expect(() => recordVendorBank(world, vendorId, { accountLast4: "1111", ifsc: "BAD", outcome: "success" })).toThrow(DomainError);
    expect(() => recordVendorKyc(world, vendorId, { idLast4: "12", hasBusinessProof: false, outcome: "verified" })).toThrow(DomainError);
  });
  it("cannot submit before every step is done, and submitting twice changes nothing", () => {
    const { world, vendorId } = created();
    expect(() => submitVendor(world, vendorId)).toThrow(DomainError);
    const ready = acceptAgreement(verified(world, vendorId), vendorId);
    const once = submitVendor(ready, vendorId);
    expect(once.vendors[vendorId].status).toBe("pending");
    expect(submitVendor(once, vendorId)).toBe(once);
  });
});

describe("review decisions", () => {
  const pending = () => {
    const { world, vendorId } = created();
    return { vendorId, world: submitVendor(acceptAgreement(verified(world, vendorId), vendorId), vendorId) };
  };
  it("accepting makes the stall active and writes the audit log", () => {
    const { world, vendorId } = pending();
    const w = decideVendor(world, vendorId, "accept", "ops:reviewer");
    expect(w.vendors[vendorId].status).toBe("accepted");
    expect(w.accounts[w.vendors[vendorId].accountId].status).toBe("accepted");
    expect(w.audit.at(-1)).toMatchObject({ action: "vendor.accepted", target: vendorId, actor: "ops:reviewer" });
  });
  it("cannot accept a stall whose bank account is not verified (the seeded pending stall)", () => {
    expect(() => decideVendor(SEEDED, "ven-juice", "accept", "ops:reviewer")).toThrow(/bank/i);
  });
  it("rejecting or asking to resubmit needs a reason; a rejected stall can resubmit", () => {
    const { world, vendorId } = pending();
    expect(() => decideVendor(world, vendorId, "reject", "ops:reviewer")).toThrow(DomainError);
    const rejected = decideVendor(world, vendorId, "reject", "ops:reviewer", "ID photo unclear");
    expect(rejected.vendors[vendorId].onboarding?.reason).toBe("ID photo unclear");
    const again = submitVendor(rejected, vendorId);
    expect(again.vendors[vendorId].status).toBe("pending");
    expect(again.vendors[vendorId].onboarding?.reason).toBeUndefined();
  });
  it("only a pending application can be decided", () => {
    expect(() => decideVendor(SEEDED, "ven-gupta-chai", "accept", "ops:reviewer")).toThrow(DomainError);
  });
});

describe("suspension and the QR", () => {
  const active = SEEDED.vendors["ven-gupta-chai"];
  it("the seeded active stall's QR checks out", () => {
    expect(checkQr(SEEDED, qrPayload("ven-gupta-chai", active.qrVersion))).toEqual({ ok: true, vendorId: "ven-gupta-chai" });
  });
  it("a suspended stall's QR says the stall isn't active", () => {
    const r = checkQr(SEEDED, qrPayload("ven-night-canteen", 1));
    expect(r).toMatchObject({ ok: false, code: "INACTIVE", message: "This stall isn't active right now." });
  });
  it("a pending stall has no working QR", () => {
    expect(checkQr(SEEDED, qrPayload("ven-juice", 1))).toMatchObject({ ok: false, code: "INACTIVE" });
  });
  it("suspending takes the QR offline and reinstating brings it back; both need a reason", () => {
    expect(() => setVendorSuspended(SEEDED, "ven-gupta-chai", true, "ops:admin", " ")).toThrow(DomainError);
    const off = setVendorSuspended(SEEDED, "ven-gupta-chai", true, "ops:admin", "Complaint under review");
    expect(checkQr(off, qrPayload("ven-gupta-chai", 1))).toMatchObject({ ok: false, code: "INACTIVE" });
    const on = setVendorSuspended(off, "ven-gupta-chai", false, "ops:admin", "Resolved");
    expect(checkQr(on, qrPayload("ven-gupta-chai", 1)).ok).toBe(true);
  });
  it("regenerating revokes the old QR at once", () => {
    const w = regenerateQr(SEEDED, "ven-gupta-chai", "ven-gupta-chai");
    expect(w.vendors["ven-gupta-chai"].qrVersion).toBe(active.qrVersion + 1);
    expect(checkQr(w, qrPayload("ven-gupta-chai", active.qrVersion))).toMatchObject({ ok: false, code: "REVOKED" });
    expect(checkQr(w, qrPayload("ven-gupta-chai", w.vendors["ven-gupta-chai"].qrVersion)).ok).toBe(true);
  });
  it("cannot regenerate a QR for a stall that isn't active", () => {
    expect(() => regenerateQr(SEEDED, "ven-juice", "x")).toThrow(DomainError);
  });
  it("forged, edited or foreign payloads are refused with a plain reason", () => {
    expect(checkQr(SEEDED, "https://example.com")).toMatchObject({ code: "MALFORMED" });
    expect(checkQr(SEEDED, qrPayload("ven-gupta-chai", 1).replace(/sig=[0-9a-f]{8}/, "sig=00000000"))).toMatchObject({ code: "BAD_SIGNATURE" });
    expect(checkQr(SEEDED, "kredo://pay/ven-gupta-chai?v=2&sig=deadbeef")).toMatchObject({ code: "BAD_SIGNATURE" });
    expect(checkQr(SEEDED, qrPayload("ven-nobody", 1))).toMatchObject({ code: "UNKNOWN_STALL" });
  });
});
