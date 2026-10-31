"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarCheck, Unlock } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { CountUp } from "@/components/shared/count-up";
import { Reveal } from "@/components/shared/reveal";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { ScoreRingOverlay } from "@/components/shared/score-ring-overlay";
import { Slider } from "@/components/ui/slider";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { getBand, limitForScore, scoreForMonths } from "@/lib/score";
import { cardRig, gaugeGl, gaugeValue } from "./scenes/card-rig";
import { SectionHeading } from "./section-heading";

export function ScoreExplainer() {
  const s = COPY.score;
  const [months, setMonths] = useState(4);
  const score = scoreForMonths(months);
  const band = getBand(score);
  const limit = limitForScore(score);
  const gl = useSyncExternalStore(gaugeGl.subscribe, gaugeGl.get, () => false);
  const anchor = useRef<HTMLDivElement>(null);

  // when the WebGL canvas is live, the 3D gauge sits over this anchor while the section is on screen
  useEffect(() => {
    const el = anchor.current;
    if (!gl || !el) return;
    cardRig.gauge.anchor = el;
    const io = new IntersectionObserver(([e]) => {
      cardRig.gauge.visible = e.isIntersecting;
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cardRig.gauge.visible = false;
      cardRig.gauge.anchor = null;
    };
  }, [gl]);

  useEffect(() => {
    gaugeValue.set(score);
  }, [score]);

  return (
    <section id="score" data-scene="score" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow={s.eyebrow} lines={["Repay on time.", "Level up."]} accent={1} />
          <Reveal className="mt-6">
            <p className="max-w-md text-lg leading-relaxed text-white/90 [html:not(.dark)_&]:text-foreground/85">{s.body}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{s.disclaimer}</p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <GlassCard radius="xl" strength="strong" glow="violet" className="p-6 sm:p-8">
            <div className="mx-auto grid aspect-square w-full max-w-[300px] place-items-center">
              {gl ? <ScoreRingOverlay value={score} anchorRef={anchor} /> : <ScoreGauge value={score} className="w-full" />}
            </div>
            <p className="mt-4 text-center text-sm text-muted" aria-live="polite">
              {months === 0 ? s.justJoined : `${months} month${months > 1 ? "s" : ""} of on-time repayments`}:{" "}
              <span className="font-bold text-foreground">{band.blurb}</span>
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.06] px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Unlock className="size-4 text-neon-magenta" aria-hidden /> {s.limitLabel}
              </span>
              <span className="text-xl font-extrabold tabular-nums">
                <CountUp value={limit} format={formatINR} immediate duration={0.6} />
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <CalendarCheck className="size-4 text-neon-blue" aria-hidden />
                <span>{s.sliderLabel}</span>
              </div>
              <Slider min={0} max={12} step={1} value={[months]} onValueChange={(v) => setMonths(v[0])} aria-label={s.sliderLabel} />
              <div className="flex justify-between text-xs text-muted" aria-hidden>
                <span>0</span>
                <span>6</span>
                <span>12</span>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
