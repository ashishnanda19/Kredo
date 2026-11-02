/**
 * ScoreProvider: how the app asks for a student's Aura. The MVP implements it in the browser over the deterministic
 * engine (lib/aura/engine.ts). The full credit-score service (services/score, scorecard v1) can implement the same
 * interface later, so nothing else changes. Aura is a display layer over one number: never compute a second score.
 */
import type { TierId } from "../policy";

export interface ScoreView {
  aura: number;
  tier: TierId;
  level: number;
  /** Sanctioned limit in coins. */
  limitCoins: number;
  consecutiveOnTime: number;
  hasPriorDefault: boolean;
  /** Per-spend cap after a default, in coins, or null when none applies. */
  postDefaultCapCoins: number | null;
}

export interface ScoreReason {
  at: number;
  reasonCode: string;
  explanation: string;
  /** The effect as shown (recency weight applied). */
  shown: number;
}

export interface ScoreProvider {
  getScore(studentId: string): Promise<ScoreView>;
  /** The most recent score events, newest first, each with a plain-English reason. */
  getReasons(studentId: string, limit?: number): Promise<ScoreReason[]>;
}
