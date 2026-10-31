"use client";

import type { RefObject } from "react";
import { gsap } from "@/lib/scroll";
import { cardRig, type CardPose } from "./card-rig";
import { useGsapScene } from "./use-gsap-scene";

type PoseFn = () => Partial<CardPose>;

/** Turn a pose factory into per-property functions so ScrollTrigger re-evaluates them on refresh. */
export function poseVars(fn: PoseFn): Record<string, () => number> {
  const out: Record<string, () => number> = {};
  for (const key of Object.keys(fn()) as (keyof CardPose)[]) {
    out[key] = () => fn()[key] as number;
  }
  return out;
}

/**
 * Scrub the card rig toward `to()` while ScrollTrigger runs from `start` to `end` on `scope`.
 * Responsive poses (desktop vs mobile) are re-evaluated on every refresh (invalidateOnRefresh).
 */
export function useRigSegment(scope: RefObject<HTMLElement | null>, opts: { start: string; end: string; to: PoseFn; from?: PoseFn }) {
  useGsapScene(scope, (root) => {
    const vars = {
      ...poseVars(opts.to),
      ease: "power2.inOut",
      scrollTrigger: { trigger: root, start: opts.start, end: opts.end, scrub: 0.8, invalidateOnRefresh: true },
    };
    // immediateRender:false so a later segment never overwrites the pose before its scroll range starts
    if (opts.from) gsap.fromTo(cardRig.pose, poseVars(opts.from), { ...vars, immediateRender: false });
    else gsap.to(cardRig.pose, vars);
  });
}
