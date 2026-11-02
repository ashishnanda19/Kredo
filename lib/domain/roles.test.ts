import { describe, expect, it } from "vitest";
import { buildSeedWorld } from "../demo/seed";
import { needsReauth, planSwitch } from "./roles";

const world = buildSeedWorld();

describe("role switching", () => {
  it("asks for the PIN again after the policy window, or when never confirmed", () => {
    expect(needsReauth(null, 1_000_000, 10)).toBe(true);
    expect(needsReauth(1_000_000, 1_000_000 + 9 * 60_000, 10)).toBe(false);
    expect(needsReauth(1_000_000, 1_000_000 + 11 * 60_000, 10)).toBe(true);
  });
  it("a student with a stall switches straight to the vendor view", () => {
    const plan = planSwitch("vendor", { studentId: "stu-vikram", vendorId: "ven-stationery", activeRole: "student" }, world);
    expect(plan).toMatchObject({ kind: "switch", href: "/vendor" });
  });
  it("a student with no stall is sent to vendor onboarding, never given a merged account", () => {
    const plan = planSwitch("vendor", { studentId: "stu-diya", vendorId: null, activeRole: "student" }, world);
    expect(plan).toMatchObject({ kind: "onboard", href: "/vendor/onboarding", reason: "missing" });
  });
  it("a stall still being verified leads to its status page", () => {
    const plan = planSwitch("vendor", { studentId: "stu-diya", vendorId: "ven-juice", activeRole: "student" }, world);
    expect(plan).toMatchObject({ kind: "onboard", href: "/vendor/onboarding/status", reason: "not_verified" });
  });
  it("a vendor with no student account is sent to student verification", () => {
    const plan = planSwitch("student", { studentId: null, vendorId: "ven-gupta-chai", activeRole: "vendor" }, world);
    expect(plan).toMatchObject({ kind: "onboard", href: "/verify" });
  });
  it("pressing the current role does nothing", () => {
    expect(planSwitch("student", { studentId: "stu-diya", vendorId: null, activeRole: "student" }, world).kind).toBe("stay");
  });
});
