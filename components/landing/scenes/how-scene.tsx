"use client";

import { useRef } from "react";
import { GraduationCap, ScanLine, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { gsap } from "@/lib/scroll";
import { SectionHeading } from "../section-heading";
import { cardRig, measureHeroPose, poses } from "./card-rig";
import { poseVars } from "./use-rig-segment";
import { useGsapScene } from "./use-gsap-scene";

const icons = [GraduationCap, Sparkles, ScanLine];

/** Where each step's text panel sits (desktop): opposite the card. Mobile: bottom sheet-style stack. */
const panelPos = [
  "lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-1/2 lg:w-[40%] lg:-translate-y-1/2",
  "lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-1/2 lg:w-[40%] lg:-translate-y-1/2",
  "lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:w-[46%] lg:-translate-x-1/2",
];

/**
 * Pinned multi-step scene. The section is pinned while the user scrolls ~3 viewports; step panels
 * reveal one by one, synced to the card choreography (verify badge -> flip to back -> flip to front + tap pulse).
 */
export function HowScene() {
  const root = useRef<HTMLElement>(null);
  const h = COPY.how;

  useGsapScene(root, (el) => {
    const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", el);
    const heading = el.querySelector("[data-how-heading]");

    // 1) hero -> step 1, scrubbed while the section scrolls up to the pin point
    gsap.fromTo(cardRig.pose, poseVars(measureHeroPose), {
      ...poseVars(poses.step1),
      ease: "power2.inOut",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: 0.8, invalidateOnRefresh: true },
    });

    // 2) pinned timeline: step 2 (flip to back), step 3 (flip to front + tap pulse)
    gsap.set(panels.slice(1), { autoAlpha: 0, y: 48 });
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: { trigger: el, start: "top top", end: "+=320%", pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
    });
    const from = { immediateRender: false };
    tl.to(panels[0], { autoAlpha: 0, y: -48, duration: 0.12 }, 0.22)
      .to(heading, { autoAlpha: 0, duration: 0.1 }, 0.22)
      .fromTo(cardRig.pose, poseVars(poses.step1), { ...poseVars(poses.step2), duration: 0.28, ...from }, 0.22)
      .to(panels[1], { autoAlpha: 1, y: 0, duration: 0.14 }, 0.38)
      .to(panels[1], { autoAlpha: 0, y: -48, duration: 0.12 }, 0.6)
      .fromTo(cardRig.pose, poseVars(poses.step2), { ...poseVars(poses.step3), duration: 0.28, ...from }, 0.6)
      .to(panels[2], { autoAlpha: 1, y: 0, duration: 0.14 }, 0.76)
      .fromTo(cardRig.pose, { pulse: 0 }, { pulse: 1, duration: 0.12, ease: 'power1.out', ...from }, 0.88);
  });

  return (
    <section id="how-it-works" ref={root} className="relative h-svh overflow-hidden">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pb-6 pt-28 sm:px-6">
        <div data-how-heading>
          <SectionHeading eyebrow={h.eyebrow} lines={["Three taps from", "broke to chai."]} accent={1} className="[&_h2]:text-2xl sm:[&_h2]:text-4xl lg:[&_h2]:text-5xl" />
        </div>

        <ol className="relative mt-4 flex-1" aria-label="Steps">
          {h.steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <li key={s.title} className={`absolute inset-x-0 bottom-0 ${panelPos[i]}`}>
                {/* GSAP animates this inner wrapper only; the li keeps its Tailwind positioning/translate */}
                <div data-panel>
                <GlassCard radius="xl" strength="strong" glow={i === 1 ? "magenta" : "violet"} className="p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-neon-violet">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-magenta">
                      {s.tag} of 3
                    </p>
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/85 [html:not(.dark)_&]:text-foreground/80">{s.body}</p>
                </GlassCard>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
