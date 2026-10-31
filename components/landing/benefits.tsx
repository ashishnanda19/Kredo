"use client";

import { useRef } from "react";
import { CreditCard, Eye, Repeat, Store, TrendingUp, Wallet } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { poses } from "./scenes/card-rig";
import { useRigSegment } from "./scenes/use-rig-segment";
import { SectionHeading } from "./section-heading";

/** Placeholder copy. Check every claim with legal/compliance before launch. */
const icons = [CreditCard, Wallet, TrendingUp, Store, Repeat, Eye];

export function Benefits() {
  const b = COPY.benefits;
  const ref = useRef<HTMLElement>(null);
  // the card leaves the how-it-works stage and tucks into the corner
  useRigSegment(ref, { start: "top bottom", end: "top 35%", from: poses.step3, to: poses.corner });
  return (
    <section id="benefits" ref={ref} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={b.eyebrow} lines={["Simple. Small.", "Clear."]} accent={1} />

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((it, i) => {
            const Icon = icons[i];
            return (
              <StaggerItem key={it.title}>
                <GlassCard radius="lg" interactive glow={i % 3 === 0 ? "violet" : i % 3 === 1 ? "magenta" : "none"} className="h-full p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-neon-violet">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">{it.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{it.body}</p>
                </GlassCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
