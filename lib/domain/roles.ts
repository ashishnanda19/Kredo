/**
 * Roles and the Student | Vendor switcher, as pure functions so the rules are testable without a screen.
 *
 * A student and a vendor are SEPARATE accounts (no single account is both). The switcher moves between two accounts
 * that belong to one person; it never merges them and never silently creates one. If the other account does not exist
 * (or is not verified) it leads to that role's onboarding instead.
 */
import type { Role, Session, WorldState } from "./types";

export type Switchable = "student" | "vendor";

export const HOME: Record<Switchable, string> = { student: "/dashboard", vendor: "/vendor" };
export const ONBOARDING: Record<Switchable, string> = { student: "/verify", vendor: "/vendor/onboarding" };
export const ONBOARDING_STATUS: Record<Switchable, string> = { student: "/verify/status", vendor: "/vendor/onboarding/status" };

/** True when the last PIN or OTP confirmation is older than the policy allows (or there was none). Wall-clock times. */
export function needsReauth(confirmedAt: number | null, nowWall: number, minutes: number): boolean {
  if (confirmedAt === null) return true;
  return nowWall - confirmedAt > minutes * 60_000;
}

export type SwitchPlan =
  | { kind: "stay"; role: Switchable; href: string }
  | { kind: "switch"; role: Switchable; href: string }
  | { kind: "onboard"; role: Switchable; href: string; reason: "missing" | "not_verified" };

/** What pressing a segment should do. */
export function planSwitch(target: Switchable, session: Pick<Session, "studentId" | "vendorId" | "activeRole">, world: Pick<WorldState, "students" | "vendors">): SwitchPlan {
  if (session.activeRole === target) return { kind: "stay", role: target, href: HOME[target] };
  const status = target === "vendor" ? (session.vendorId ? world.vendors[session.vendorId]?.status : undefined) : session.studentId ? world.students[session.studentId]?.verification : undefined;
  if (!status || status === "not_started") return { kind: "onboard", role: target, href: ONBOARDING[target], reason: "missing" };
  if (status !== "accepted") return { kind: "onboard", role: target, href: ONBOARDING_STATUS[target], reason: "not_verified" };
  return { kind: "switch", role: target, href: HOME[target] };
}

export const isRole = (x: unknown): x is Role => x === "student" || x === "vendor" || x === "ops";
