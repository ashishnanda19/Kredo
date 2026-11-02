"use client";

import Link from "next/link";
import { ArrowRight, PauseCircle } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { CountUp } from "@/components/shared/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { AURA } from "@/lib/copy-aura";
import { useAura } from "@/lib/score/use-aura";
import { StreakChip } from "./parts";

/** Dashboard home: Aura number, tier, streak and one chip, linking to /dashboard/aura. */
export function AuraWidget() {
  const { status, view } = useAura();
  const W = AURA.widget;
  const paused = view?.state === "knockout" || view?.state === "consent_frozen";

  return (
    <GlassCard role="region" radius="lg" aria-label={W.title} className="h-full p-5" data-testid="aura-widget">
      <Link href="/dashboard/aura" className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
        <h2 className="flex items-center justify-between text-[16px] font-semibold tracking-[-0.015em]">
          {W.title} <ArrowRight className="size-4 text-ink-2 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </h2>
        {status === "loading" && <Skeleton className="mt-3 h-20 w-full" />}
        {status === "no_score" && <p className="mt-2 text-sm text-ink-2">{AURA.states.noScoreBody}</p>}
        {view && paused && (
          <p className="mt-3 flex items-start gap-2 text-sm"><PauseCircle className="mt-0.5 size-4 shrink-0 text-warn-text" aria-hidden /> {view.notice?.title}. {W.paused}</p>
        )}
        {view && !paused && (
          <div className="mt-3 flex items-center gap-4">
            <span className="text-5xl font-semibold leading-none tracking-[-0.045em] tabular-nums"><CountUp value={view.aura} immediate /></span>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-semibold">{view.freshSpawn ? AURA.freshSpawn.name : view.tier.name}</p>
              <div className="flex flex-wrap gap-1.5">
                <StreakChip n={view.streak} />
                {view.boosts[0] && <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-ok-text">{view.boosts[0].chip}</span>}
              </div>
            </div>
          </div>
        )}
        {view?.state === "held" && <p className="mt-2 text-xs font-semibold text-warn-text">{W.held}</p>}
      </Link>
      <p className="mt-3 text-[11px] leading-snug text-ink-2" data-testid="aura-disclaimer">{AURA.disclaimer}</p>
    </GlassCard>
  );
}
