/**
 * Fraud flags: rules that raise a flag for an ops analyst to look at. Flags never block a payment by themselves (the
 * pay gates do that) and never touch money. The rules are plain and explainable, with thresholds in lib/policy.ts.
 *
 *   SELF_PAY, VELOCITY_*   raised by the pay flow when it blocks an attempt (lib/domain/pay.ts)
 *   ROUND_CLUSTER          several round-number payments to one stall just before the cut-off
 *   CONCENTRATION          one student making up most of a stall's takings
 *   SHARED_DEVICE          two student accounts on one device
 *
 * The last three run at the nightly cut-off, and only once the live demo has begun (not while the seed history is built).
 */
import type { Draft } from "immer";
import { appendAudit } from "./audit";
import { getPolicy, type Policy } from "../policy";
import { DAY, HOUR, istDate } from "./time";
import type { FraudFlag, FraudFlagKind, WorldState } from "./types";

/** Adds a flag to a draft world, once per kind, student, stall and day. Returns the flag, or null if it already existed. */
export function raiseFlag(d: Draft<WorldState>, kind: FraudFlagKind, studentId: string, vendorId: string, detail: string, at: number): FraudFlag | null {
  const day = istDate(at);
  if (d.flags.some((f) => f.kind === kind && f.studentId === studentId && f.vendorId === vendorId && istDate(f.at) === day)) return null;
  const f: FraudFlag = { id: `F-${String(++d.seq).padStart(5, "0")}`, at, kind, studentId, vendorId, detail, status: "open" };
  d.flags.push(f);
  d.audit = appendAudit(d.audit, { at, actor: "system", action: "fraud.flagged", target: f.id, details: { kind, studentId, vendorId } }, ++d.seq);
  return f;
}

/** The nightly rules. `cutoff` is the instant the batch closes. */
export function runFraudRules(d: Draft<WorldState>, cutoff: number, p: Policy = getPolicy()): void {
  if (!d.monitoring) return;
  const f = p.fraud;
  const loans = Object.values(d.loans).filter((l) => l.status !== "refunded");

  // round-amount clustering in the hours before the cut-off
  const windowStart = cutoff - f.roundWindowHours * HOUR;
  const byPair = new Map<string, { count: number; student: string; vendor: string }>();
  for (const l of loans) {
    if (l.createdAt < windowStart || l.createdAt >= cutoff || l.coins % f.roundMultiple !== 0) continue;
    const key = l.vendorId;
    const cur = byPair.get(key) ?? { count: 0, student: l.studentId, vendor: l.vendorId };
    cur.count++;
    byPair.set(key, cur);
  }
  for (const [, v] of [...byPair.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (v.count >= f.roundMinCount) raiseFlag(d, "ROUND_CLUSTER", v.student, v.vendor, `${v.count} round-number payments to one stall in the ${f.roundWindowHours} hours before the cut-off.`, cutoff - 1);
  }

  // concentration over the last 7 days
  const since = cutoff - 7 * DAY;
  const byVendor = new Map<string, { total: number; students: Map<string, number> }>();
  for (const l of loans) {
    if (l.createdAt < since || l.createdAt >= cutoff) continue;
    const cur = byVendor.get(l.vendorId) ?? { total: 0, students: new Map<string, number>() };
    cur.total += l.coins;
    cur.students.set(l.studentId, (cur.students.get(l.studentId) ?? 0) + l.coins);
    byVendor.set(l.vendorId, cur);
  }
  for (const [vendorId, v] of [...byVendor.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (v.total < f.concentrationMinCoins) continue;
    for (const [studentId, coins] of [...v.students.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const pct = Math.round((coins / v.total) * 100);
      if (pct >= f.concentrationPercent) raiseFlag(d, "CONCENTRATION", studentId, vendorId, `${pct}% of the stall's takings over 7 days (${coins} of ${v.total} coins) came from one student.`, cutoff - 1);
    }
  }

  // two student accounts on one device
  const byDevice = new Map<string, string[]>();
  for (const [id, s] of Object.entries(d.students)) {
    const link = d.accounts[s.accountId]?.deviceLinkId;
    if (link) byDevice.set(link, [...(byDevice.get(link) ?? []), id]);
  }
  for (const [device, ids] of [...byDevice.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (ids.length > 1) raiseFlag(d, "SHARED_DEVICE", ids.sort()[0], "", `${ids.length} student accounts share device ${device}.`, cutoff - 1);
  }
}

/** Ops decision on a flag. */
export function decideFlag(d: Draft<WorldState>, id: string, outcome: "confirmed" | "dismissed", actor: string, note: string, at: number): boolean {
  const f = d.flags.find((x) => x.id === id);
  if (!f || f.status !== "open") return false;
  f.status = outcome;
  f.decidedBy = actor;
  f.decidedAt = at;
  f.note = note;
  d.audit = appendAudit(d.audit, { at, actor, action: `fraud.${outcome}`, target: id, details: { note } }, ++d.seq);
  return true;
}
