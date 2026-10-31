import { COPY } from "./copy";

export type ScoreBand = {
  label: string;
  tone: "warning" | "accent" | "success";
  blurb: string;
};

/** Kredo Score runs 0 to 100. It is our own in-app score, not a credit bureau score. */
export function getBand(score: number): ScoreBand {
  const b = COPY.score.bands;
  if (score < 40) return { ...b.building, tone: "warning" };
  if (score < 70) return { ...b.good, tone: "accent" };
  return { ...b.great, tone: "success" };
}

/** Rough illustrative curve used by the landing-page explainer slider. */
export function scoreForMonths(months: number): number {
  const m = Math.max(0, Math.min(12, months));
  return Math.round(30 + 62 * (1 - Math.exp(-m / 5)));
}

/** Illustrative limit (Rs) unlocked at a given score. Placeholder numbers. */
export function limitForScore(score: number): number {
  if (score < 40) return 1000;
  if (score < 55) return 2000;
  if (score < 70) return 3000;
  if (score < 85) return 4000;
  return 5000;
}
