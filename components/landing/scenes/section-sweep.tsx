"use client";

import { useRef } from "react";
import { gsap } from "@/lib/scroll";
import { useGsapScene } from "./use-gsap-scene";

/**
 * Soft light-sweep between sections (no hard cuts): a thin neon line plus glow whose width and
 * position are scrubbed by scroll. Purely decorative.
 */
export function SectionSweep({ hue = "violet" }: { hue?: "violet" | "magenta" | "blue" }) {
  const ref = useRef<HTMLDivElement>(null);
  const colour = { violet: "var(--neon-violet)", magenta: "var(--neon-magenta)", blue: "var(--neon-blue)" }[hue];

  useGsapScene(ref, (root) => {
    const beam = root.querySelector("[data-beam]");
    gsap.fromTo(
      beam,
      { scaleX: 0.15, xPercent: -45, opacity: 0 },
      {
        scaleX: 1,
        xPercent: 45,
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top 95%", end: "bottom 5%", scrub: true },
      },
    );
  });

  return (
    <div ref={ref} aria-hidden className="relative h-20 overflow-hidden">
      <div
        data-beam
        className="absolute left-0 top-1/2 h-px w-full opacity-0"
        style={{ background: `linear-gradient(90deg, transparent, ${colour}, transparent)`, boxShadow: `0 0 24px 4px color-mix(in oklab, ${colour} 55%, transparent)` }}
      />
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(60%_100%_at_50%_50%,color-mix(in_oklab,var(--neon-violet)_10%,transparent),transparent)]" />
    </div>
  );
}
