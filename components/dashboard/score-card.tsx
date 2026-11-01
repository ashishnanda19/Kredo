"use client";

import dynamic from "next/dynamic";
import { ArrowUpRight, Lightbulb } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { InfoTip } from "@/components/shared/info-tip";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { score } from "@/lib/mock-data";
import { getBand } from "@/lib/score";

// Recharts is heavy: only load it on the client
const ScoreTrend = dynamic(() => import("./score-trend"), { ssr: false, loading: () => <Skeleton className="h-20 w-full" /> });

export function ScoreCard() {
  const d = COPY.dashboard.score;
  const band = getBand(score.current);
  const delta = score.current - score.history.at(-2)!.score;

  return (
    <GlassCard role="region" radius="lg" className="h-full p-5" aria-label={d.title}>
      <h2 className="flex items-center gap-1.5 text-[16px] font-semibold tracking-[-0.015em]">
        {d.title}
        <InfoTip text={d.tip} label="What is the score?" />
      </h2>

      <ScoreGauge value={score.current} className="mx-auto mt-2 w-full max-w-[250px]" />

      <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-ink/[0.07] px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{band.blurb}</p>
          <p className="flex items-center gap-1 text-xs font-semibold text-ok-text">
            <ArrowUpRight className="size-3.5" aria-hidden /> Up {delta} since last month
          </p>
        </div>
      </div>

      <ScoreTrend />

      <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold">
        <Lightbulb className="size-4 text-warn-text" aria-hidden /> {d.levelUp}
      </h3>
      <ul className="mt-2 space-y-2">
        {COPY.score.tips.map((t) => (
          <li key={t.title} className="flex items-center justify-between gap-3 text-sm">
            <span>{t.title}</span>
            <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-ok-text">{t.gain}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
