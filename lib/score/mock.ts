/**
 * Mock adapter: the Aura the demo shows while SCORE_API_URL is unset. It reads the demo state (zustand) to choose a
 * fixture, and the fixtures come from the real engine (services/score: `make fixtures`), mapped by the same code as
 * live responses. Loaded only in mock mode.
 */
import type { PortalState } from "@/lib/store/types";
import type { AuraHistoryView, AuraPreset, AuraView, HistoryRaw, ScoreInput, SimulateInput, Status, WhatIfView } from "./types";
import { toAuraView, toHistoryView, toWhatIfView } from "./view";

type Fixture = {
  score: ScoreInput;
  history: HistoryRaw;
  what_ifs: { days_early: number; loan_id: string; amount_paise: number; result: SimulateInput }[];
};
type Fixtures = { as_of: string; presets: Record<AuraPreset, Fixture> };

let cache: Promise<Fixtures> | null = null;
const load = () => (cache ??= import("./fixtures.json").then((m) => m.default as unknown as Fixtures));

export type MockChoice = AuraPreset | "unavailable" | "no_score";

/** An explicit demo preset wins; otherwise the portal state picks the closest fixture. */
export function chooseFixture(s: Pick<PortalState, "aura" | "verification" | "consents" | "loans">): MockChoice {
  if (s.aura.preset) return s.aura.preset;
  if (s.verification.status !== "accepted") return "no_score";
  if (s.consents.credit?.granted === false) return "consent_frozen";
  const schedule = s.loans.flatMap((l) => l.schedule);
  if (schedule.some((i) => i.state === "overdue")) return "knockout_overdue_35";
  return schedule.filter((i) => i.state === "paid").length >= 2 ? "locked_in_streak" : "fresh_spawn";
}

const LAST_KNOWN: AuraPreset = "locked_in_streak";

export async function mockAura(choice: MockChoice): Promise<{ status: Exclude<Status, "loading">; view: AuraView | null }> {
  if (choice === "no_score") return { status: "no_score", view: null };
  const f = await load();
  if (choice === "unavailable") {
    // what a student sees when the service is down: the last known Aura, two days old
    const view = toAuraView(f.presets[LAST_KNOWN].score);
    return { status: "unavailable", view: { ...view, updatedAt: new Date(new Date(view.updatedAt).getTime() - 2 * 86_400_000).toISOString() } };
  }
  return { status: "ok", view: toAuraView(f.presets[choice].score) };
}

export async function mockHistory(choice: MockChoice, days: number): Promise<AuraHistoryView | null> {
  if (choice === "no_score" || choice === "unavailable") return null;
  const f = await load();
  const h = f.presets[choice].history;
  const from = new Date(new Date(f.as_of).getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return toHistoryView({ ...h, days: h.days.filter((d) => d.date >= from), markers: h.markers.filter((m) => m.date >= from) });
}

export async function mockWhatIf(choice: MockChoice, daysEarly: number): Promise<WhatIfView | null> {
  if (choice === "no_score" || choice === "unavailable") return null;
  const f = await load();
  const options = f.presets[choice].what_ifs;
  // fixtures hold a few slider positions; use the nearest one at or below the chosen value
  const pick = [...options].reverse().find((w) => w.days_early <= daysEarly) ?? options[0];
  if (!pick) return null;
  const loan = f.presets[choice].score.limit_reco?.open_loans?.find((l) => l.loan_id === pick.loan_id);
  return toWhatIfView(pick.result, pick.days_early, pick.amount_paise, loan?.due_date ?? "");
}
