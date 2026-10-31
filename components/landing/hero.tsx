import { ArrowRight, Play } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { Disclosure } from "@/components/shared/demo-tag";
import { COPY } from "@/lib/copy";
import { HeroVisual } from "./hero-visual";

/**
 * Hero. Server-rendered, with CSS-only entrance animation (no JS needed to paint it), so the
 * headline is the LCP and is never held back by hydration or the 3D bundle.
 */
export function Hero() {
  const h = COPY.hero;
  return (
    <section id="top" data-scene="hero" className="relative overflow-hidden">
      {/* faint light beams */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="light-beam" />
        <div className="light-beam" style={{ animationDelay: "-7s", left: "40%", width: "14vw" }} />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-28">
        <div>
          <p className="anim-rise glass glass-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <span aria-hidden className="size-2 rounded-full bg-neon-magenta shadow-[0_0_10px_2px_var(--glow-magenta)]" />
            {h.eyebrow}
          </p>

          <h1 className="mt-6 text-balance text-[2.75rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.1rem] xl:text-[4.4rem]">
            <span className="block overflow-hidden pb-[0.1em]">
              <span className="anim-line block" style={{ "--d": "0.05s" } as React.CSSProperties}>
                {h.titleA}
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span className="anim-line gradient-text block" style={{ "--d": "0.15s" } as React.CSSProperties}>
                {h.titleB}
              </span>
            </span>
          </h1>

          <p
            className="anim-rise mt-6 max-w-xl text-lg text-white/90 [html:not(.dark)_&]:text-foreground/85 sm:text-xl"
            style={{ "--d": "0.25s" } as React.CSSProperties}
          >
            {h.sub}
          </p>

          <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--d": "0.35s" } as React.CSSProperties}>
            <GlassButton asChild size="lg">
              <a href="#signup">
                {h.primary} <ArrowRight className="size-5" aria-hidden />
              </a>
            </GlassButton>
            <GlassButton asChild size="lg" variant="secondary">
              <a href="#how-it-works">
                <Play className="size-4" aria-hidden /> {h.secondary}
              </a>
            </GlassButton>
          </div>

          <div className="anim-rise mt-6 space-y-1.5" style={{ "--d": "0.5s" } as React.CSSProperties}>
            <p className="text-sm font-semibold">{COPY.legal.nudge}</p>
            <Disclosure />
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
