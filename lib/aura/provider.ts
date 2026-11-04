/**
 * The MVP ScoreProvider: answers from the deterministic engine over the demo world. The full credit-score service can
 * implement the same interface later. Aura is a display layer over one number (KRS = 400 + 4 x Aura); nothing here
 * computes a second score, and nothing here reads college, gender, caste, religion or location.
 */
import type { ScoreProvider, ScoreReason, ScoreView } from "../api/score-provider";
import { postDefaultCap, displayedEffect } from "./engine";
import { studentEvents, studentState } from "../domain/selectors";
import type { WorldState } from "../domain/types";

export function createEngineScoreProvider(getWorld: () => WorldState): ScoreProvider {
  return {
    async getScore(studentId): Promise<ScoreView> {
      const w = getWorld();
      const s = studentState(w, studentId);
      return { aura: s.aura, tier: s.tier, level: s.level, limitCoins: s.limit, consecutiveOnTime: s.consecutiveOnTime, hasPriorDefault: s.hasPriorDefault, postDefaultCapCoins: postDefaultCap(s) };
    },
    async getReasons(studentId, limit = 10): Promise<ScoreReason[]> {
      const w = getWorld();
      return [...studentEvents(w, studentId)]
        .filter((e) => e.at <= w.clock.now)
        .sort((a, b) => b.at - a.at || b.id.localeCompare(a.id))
        .slice(0, limit)
        .map((e) => ({ at: e.at, reasonCode: e.reasonCode, explanation: e.explanation, shown: displayedEffect(e, w.clock.now).shown }));
    },
  };
}
