/**
 * Score types. `api-types.ts` is generated from the score service's OpenAPI schema (`make openapi` in
 * services/score), so the BFF and the service never drift. The *Input types are what the mapper reads: the service
 * response minus internal fields, which is also exactly what the mock fixtures contain.
 */
import type { components } from "./api-types";
import type { TierId } from "@/lib/copy-aura";

type Schemas = components["schemas"];
export type ScoreRaw = Schemas["ScoreOut"];
export type HistoryRaw = Schemas["HistoryOut"];
export type SimulateRaw = Schemas["SimulateOut"];

type SafeReason = { code: string; direction: "up" | "down" | "neutral" };
type SafeSim = Omit<Schemas["SimView"], "krs" | "band" | "reason_codes"> & { reason_codes: SafeReason[] };

export type ScoreInput = Omit<ScoreRaw, "krs" | "pd" | "band" | "reason_codes"> & { reason_codes: SafeReason[] };
export type SimulateInput = Omit<SimulateRaw, "current" | "projected"> & { current: SafeSim; projected: SafeSim };

export type AuraPreset =
  | "fresh_spawn"
  | "locked_in_streak"
  | "late_payer_recovering"
  | "knockout_overdue_35"
  | "collusion_alert"
  | "held_for_review"
  | "consent_frozen";

export type AuraState = "normal" | "fresh_spawn" | "knockout" | "consent_frozen" | "held";

/** The student view. Never krs, pd, band or points: only Aura, tier, streak and plain reasons. */
export interface AuraView {
  state: AuraState;
  aura: number;
  tier: { id: TierId; name: string; line: string };
  freshSpawn: boolean;
  streak: number;
  boosts: { code: string; text: string; chip: string }[];
  holdbacks: { code: string; text: string; action: { label: string; href: string } }[];
  notice: null | { kind: "knockout" | "held" | "consent"; code: string; title: string; body: string; action: { label: string; href: string } };
  limit: {
    level: string | null;
    amountPaise: number;
    eligible: boolean;
    /** blockers: plain sentences for the student, already translated from the service's codes */
    next: null | { level: string; amountPaise: number; cyclesNeeded: number; blockers: string[] };
    ladder: { level: string; amountPaise: number }[];
  };
  openLoans: { loanId: string; dueDate: string; outstandingPaise: number; dpd: number }[];
  updatedAt: string;
}

export type MarkerKind = "repaid_early" | "repaid_on_time" | "repaid_late" | "level_up" | "level_down";

export interface AuraHistoryView {
  days: { date: string; aura: number }[];
  markers: { date: string; kind: MarkerKind; label: string; text: string; aura: number | null }[];
  frozen: boolean;
}

export interface WhatIfView {
  daysEarly: number;
  amountPaise: number;
  dueDate: string;
  at: string;
  current: number;
  projected: number;
  change: number;
  tier: string;
}

export type Status = "loading" | "ok" | "no_score" | "unavailable";
export type Source = "live" | "mock";

/** What GET /api/score/me returns to the browser. */
export type MeResponse = { source: "mock" } | { source: "live"; status: Exclude<Status, "loading">; view: AuraView | null };
export type HistoryResponse = { source: "mock" } | { source: "live"; status: Exclude<Status, "loading">; history: AuraHistoryView | null };
export type WhatIfResponse = { source: "mock" } | { source: "live"; status: "ok" | "unavailable" | "busy" | "no_loan"; whatIf: WhatIfView | null };
