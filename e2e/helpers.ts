import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

type Fixture = { score: { user_id: string; aura: number; tier: string } };
export const FIXTURES = (JSON.parse(readFileSync(join(process.cwd(), "lib/score/fixtures.json"), "utf8")) as { presets: Record<string, Fixture> }).presets;
export const DOWN_USER = "00000000-0000-4000-8000-00000000dead";
export const INTERNAL_KEYS = ["krs", "pd", "band", "points"];

/** A logged-in, verified demo student (the dashboard gate needs both), optionally on an Aura preset. */
export async function asStudent(page: Page, preset: string | null = null) {
  const state = {
    version: 1,
    state: {
      session: { loggedIn: true, mobile: "+91 98••• ••210", edge: "none", otpAttempts: 0, timeoutWarning: false },
      verification: { status: "accepted", reason: null, attempts: 1, submittedAt: null, summary: null, timeline: [], celebrated: true, resumeStep: null, notListedRef: null },
      kyc: { status: "verified", retries: 0, reference: null, maskedId: null },
      aura: { preset, statementReviewed: false },
    },
  };
  await page.addInitScript((s) => {
    if (!localStorage.getItem("kredo-demo-state")) localStorage.setItem("kredo-demo-state", s);
  }, JSON.stringify(state));
}

/** Every key at every depth of a JSON value. */
export function keysOf(x: unknown): string[] {
  if (Array.isArray(x)) return x.flatMap(keysOf);
  if (x && typeof x === "object") return Object.entries(x).flatMap(([k, v]) => [k, ...keysOf(v)]);
  return [];
}

type OpsFixtures = { users: { rows: { user_id: string; band: string; krs: number }[] } };
export const OPS = JSON.parse(readFileSync(join(process.cwd(), "lib/score/ops-fixtures.json"), "utf8")) as OpsFixtures;

/** An ops user with this demo role (the ops pages read it from the demo store). */
export async function asOps(page: Page, role: string) {
  const ops = { role, audit: [], decisions: {}, fraud: {}, tickets: {}, reconFlags: {}, escalations: [], retries: {} };
  await page.addInitScript((s) => localStorage.setItem("kredo-demo-state", s), JSON.stringify({ version: 1, state: { ops } }));
}
