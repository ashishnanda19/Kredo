/**
 * The limit ladder as a student sees it: where they are, what the next step needs, what is holding it back, and what
 * moved their limit before. Pure views over the event log and the policy.
 */
import { deriveState } from "../aura/engine";
import { getPolicy } from "../policy";
import { studentEvents, studentState } from "./selectors";
import { DAY } from "./time";
import type { WorldState } from "./types";

export interface LadderRow {
  level: number;
  limit: number;
  minAura: number;
  status: "reached" | "current" | "next" | "locked";
}

export interface LimitChange {
  at: number;
  from: number;
  to: number;
  fromLimit: number;
  toLimit: number;
  why: string;
}

export interface LadderView {
  rows: LadderRow[];
  currentLevel: number;
  currentLimit: number;
  nextLevel: number | null;
  nextLimit: number | null;
  /** What the next step still needs, in plain words. Empty when the top is reached or nothing is missing. */
  needs: string[];
  postDefaultCap: number | null;
  pendingApproval: boolean;
  history: LimitChange[];
}

export function ladderView(w: WorldState, studentId: string, at: number = w.clock.now): LadderView {
  const p = getPolicy();
  const lv = p.ladder.levels;
  const s = studentState(w, studentId, at);
  const events = studentEvents(w, studentId).filter((e) => e.at <= at).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));

  const rows: LadderRow[] = lv.map((l, i) => ({
    level: i + 1, limit: l.limit, minAura: l.minAura,
    status: i + 1 < s.level ? "reached" : i + 1 === s.level ? "current" : i + 1 === s.level + 1 ? "next" : "locked",
  }));

  const nextLevel = s.level < lv.length ? s.level + 1 : null;
  const needs: string[] = [];
  if (nextLevel) {
    const remaining = Math.max(0, p.ladder.onTimeToStepUp - s.stepProgress);
    if (remaining > 0) needs.push(`${remaining} more on-time repayment${remaining === 1 ? "" : "s"} (${s.stepProgress} of ${p.ladder.onTimeToStepUp} so far)`);
    const minAura = lv[nextLevel - 1].minAura;
    if (s.aura < minAura) needs.push(`An Aura of ${minAura} or more (yours is ${s.aura})`);
    if (s.hasPriorDefault && s.defaultClearedAt === null) needs.push("The defaulted amount paid in full");
    if (s.coolingOffUntil !== null && at < s.coolingOffUntil) {
      const days = Math.ceil((s.coolingOffUntil - at) / DAY);
      needs.push(`A short pause after clearing a default: about ${days} more day${days === 1 ? "" : "s"} before limits can grow`);
    }
    if (s.pendingIncreaseToLevel) needs.length = 0;
  }

  const history: LimitChange[] = [];
  let prev = 1;
  events.forEach((e, i) => {
    const level = deriveState(events.slice(0, i + 1), e.at, p).level;
    if (level !== prev) {
      history.push({ at: e.at, from: prev, to: level, fromLimit: lv[prev - 1].limit, toLimit: lv[level - 1].limit, why: e.explanation });
      prev = level;
    }
  });

  return {
    rows, currentLevel: s.level, currentLimit: s.limit, nextLevel, nextLimit: nextLevel ? lv[nextLevel - 1].limit : null, needs,
    postDefaultCap: s.postDefaultCapActive ? p.defaultMemory.postDefaultCap : null,
    pendingApproval: s.pendingIncreaseToLevel !== null,
    history: history.reverse(),
  };
}
