/** Steps of the points waterfall: the 500 base, each factor's points, the clamp, the velocity cap, the final KRS. */
import { FACTOR_LABEL, FACTOR_ORDER } from "./labels";
import type { Snapshot } from "./types";

export type Step = { name: string; offset: number; size: number; delta: number; kind: "total" | "up" | "down"; label: string };

export function waterfallSteps(points: Snapshot["points"], krs: number): Step[] {
  const steps: Step[] = [{ name: "Base", offset: 0, size: points.base, delta: points.base, kind: "total", label: String(points.base) }];
  let run = points.base;
  const add = (name: string, d: number) => {
    if (!d) return;
    steps.push({ name, offset: Math.min(run, run + d), size: Math.abs(d), delta: d, kind: d > 0 ? "up" : "down", label: `${d > 0 ? "+" : ""}${d}` });
    run += d;
  };
  for (const f of FACTOR_ORDER) add(FACTOR_LABEL[f], points.factors[f]?.points ?? 0);
  // the clamp to 0..1000 sits between the raw sum and raw_krs
  add("Clamp to 0–1000", points.raw_krs - run);
  add("Velocity cap", points.velocity_cap);
  steps.push({ name: "KRS", offset: 0, size: krs, delta: krs, kind: "total", label: String(krs) });
  return steps;
}
