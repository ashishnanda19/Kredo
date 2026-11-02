/**
 * Maps score-service responses to the student view. Shared by the BFF (live) and the mock adapter (fixtures), so
 * both screens are built the same way. The output never carries krs, pd, band or points.
 */
import { AURA, type TierId } from "@/lib/copy-aura";
import { formatDateLong, formatINR } from "@/lib/format";
import type { AuraHistoryView, AuraView, HistoryRaw, MarkerKind, ScoreInput, SimulateInput, WhatIfView } from "./types";

/** Which notice wins when several apply: consent first (the score is frozen), then the money ones. */
const NOTICE_ORDER = ["KO_CONSENT", "KO_OVERDUE_30", "KO_FRAUD", "KO_DUPLICATE", "KO_DPD90_12M", "KO_WRITTEN_OFF", "KO_KYC"];

export const rupees = (paise: number) => formatINR(paise / 100);

function tierOf(id: string) {
  const known = (id in AURA.tiers ? id : "side_quest") as TierId;
  return { id: known, ...AURA.tiers[known] };
}

function notice(s: ScoreInput): AuraView["notice"] {
  const code = NOTICE_ORDER.find((k) => s.knockouts.includes(k)) ?? s.knockouts[0];
  if (code) {
    const n = AURA.notices[code] ?? AURA.notices.KO_FRAUD;
    const overdue = (s.limit_reco?.open_loans ?? []).filter((l) => l.dpd > 0).reduce((a, l) => a + l.outstanding_paise, 0);
    const arg = code === "KO_CONSENT" ? formatDateLong(s.evaluated_at ?? s.as_of) : rupees(overdue);
    return { kind: code === "KO_CONSENT" ? "consent" : "knockout", code, title: n.title, body: n.body(arg), action: n.action };
  }
  if (s.limit_reco?.held_for_review) {
    const n = AURA.notices.HELD;
    return { kind: "held", code: "HELD", title: n.title, body: n.body(""), action: n.action };
  }
  return null;
}

export function toAuraView(s: ScoreInput): AuraView {
  const n = notice(s);
  const reco = s.limit_reco;
  const state: AuraView["state"] = n?.kind === "consent" ? "consent_frozen" : n?.kind === "knockout" ? "knockout" : n?.kind === "held" ? "held" : s.fresh_spawn ? "fresh_spawn" : "normal";
  return {
    state,
    aura: s.aura,
    tier: tierOf(s.tier),
    freshSpawn: s.fresh_spawn,
    streak: s.streak,
    boosts: s.reason_codes
      .filter((r) => r.direction !== "down" && AURA.boosts[r.code])
      .slice(0, 3)
      .map((r) => ({ code: r.code, ...AURA.boosts[r.code] })),
    holdbacks: s.reason_codes
      // the overdue notice already carries the Pay action
      .filter((r) => r.direction === "down" && !(r.code === "OVERDUE_NOW" && n?.code === "KO_OVERDUE_30"))
      .slice(0, 3)
      .map((r) => {
        const h = AURA.holdbacks[r.code] ?? AURA.unknownHoldback;
        return { code: r.code, text: h.text, action: { label: h.action, href: h.href } };
      }),
    notice: n,
    limit: {
      level: reco?.level ?? null,
      amountPaise: reco?.amount_paise ?? 0,
      eligible: reco?.eligible ?? false,
      // blockers become their plain sentences here, so internal codes (such as "band") never reach the browser
      next: reco?.next
        ? { level: reco.next.level, amountPaise: reco.next.amount_paise, cyclesNeeded: reco.next.cycles_needed, blockers: reco.next.blockers.map((b) => AURA.levelUp.blockers[b]).filter(Boolean) }
        : null,
      ladder: (s.ladder_levels ?? []).map((l) => ({ level: l.level, amountPaise: l.amount_paise })),
    },
    openLoans: (reco?.open_loans ?? []).map((l) => ({ loanId: l.loan_id, dueDate: l.due_date, outstandingPaise: l.outstanding_paise, dpd: l.dpd })),
    updatedAt: s.as_of,
  };
}

export function toHistoryView(h: HistoryRaw): AuraHistoryView {
  const byDate = new Map(h.days.map((d) => [d.date, d.aura]));
  return {
    days: h.days,
    frozen: h.frozen,
    markers: h.markers.map((m) => {
      const copy = AURA.history.markers[m.kind as MarkerKind];
      return { date: m.date, kind: m.kind as MarkerKind, label: copy.label, text: copy.text(rupees(m.amount_paise)), aura: byDate.get(m.date) ?? null };
    }),
  };
}

export function toWhatIfView(sim: SimulateInput, daysEarly: number, amountPaise: number, dueDate: string): WhatIfView {
  return {
    daysEarly,
    amountPaise,
    dueDate,
    at: sim.at,
    current: sim.current.aura,
    projected: sim.projected.aura,
    change: sim.aura_change,
    tier: tierOf(sim.projected.tier).name,
  };
}

/** The keys a student response must never contain, at any depth. Checked by the BFF tests. */
export const INTERNAL_KEYS = ["krs", "pd", "band", "points"] as const;
