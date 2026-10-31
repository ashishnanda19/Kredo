"use client";

import { GraduationCap, ScanLine, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/lib/quality";
import { SectionHeading } from "./section-heading";
import { HowScene } from "./scenes/how-scene";

const icons = [GraduationCap, Sparkles, ScanLine];

/** Reduced motion: a plain stacked version with no pinning and no scrubbing. */
function HowStatic() {
  const h = COPY.how;
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow={h.eyebrow} lines={["Three taps from", "broke to chai."]} accent={1} />
      <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
        {h.steps.map((s, i) => {
          const Icon = icons[i];
          return (
            <StaggerItem key={s.title}>
              <GlassCard radius="lg" className="h-full p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-neon-violet">
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-neon-magenta">{s.tag}</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </GlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

export function HowItWorks() {
  const reduce = usePrefersReducedMotion();
  return reduce ? <HowStatic /> : <HowScene />;
}
