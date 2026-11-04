"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { AURA } from "@/lib/copy-aura";
import { formatDateLong } from "@/lib/format";
import { useAura } from "@/lib/score/use-aura";
import type { AuraView } from "@/lib/score/types";
import { AuraGauge, AuraSkeleton, MoreLink, NoScore, NoticeCard, TierCard, UnavailableBanner } from "./parts";

function Boosts({ view }: { view: AuraView }) {
  return (
    <GlassCard radius="lg" role="region" aria-label={AURA.boostsTitle} className="p-5">
      <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{AURA.boostsTitle}</h2>
      {view.boosts.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">{AURA.noBoosts}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {view.boosts.map((b) => (
            <li key={b.code} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{b.text}</span>
              <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-ok-text">{b.chip}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function Holdbacks({ view }: { view: AuraView }) {
  return (
    <GlassCard radius="lg" role="region" aria-label={AURA.holdbacksTitle} className="p-5">
      <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{AURA.holdbacksTitle}</h2>
      {view.holdbacks.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">{AURA.noHoldbacks}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10">
          {view.holdbacks.map((h) => (
            <li key={h.code} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <span className="min-w-0 text-sm">{h.text}</span>
              <Link href={h.action.href} className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold hover:bg-ink/10">
                {h.action.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function Hero({ view, frozen }: { view: AuraView; frozen: boolean }) {
  return (
    <GlassCard radius="xl" strength="strong" className="p-5 sm:p-6" data-testid="aura-hero">
      <div className="grid items-center gap-5 sm:grid-cols-[240px_1fr]">
        <AuraGauge value={view.aura} label={AURA.gaugeLabel(view.aura, view.tier.name)} />
        <div className="space-y-3">
          {!frozen && <TierCard view={view} />}
          <p className="text-xs text-ink-2">{AURA.updated(formatDateLong(view.updatedAt))}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export function AuraHome() {
  const { status, view } = useAura();
  if (status === "loading") return <AuraSkeleton />;
  if (status === "no_score") return <NoScore />;

  return (
    <div className="space-y-5" data-testid={`aura-state-${status === "unavailable" ? "unavailable" : view?.state}`}>
      {status === "unavailable" && <UnavailableBanner updatedAt={view?.updatedAt ?? null} />}
      {view && (
        <>
          {view.notice && <NoticeCard notice={view.notice} />}
          {/* a knockout shows the calm notice and what helps, never the number or a tier name */}
          {view.state !== "knockout" && <Hero view={view} frozen={view.state === "consent_frozen"} />}
          <div className="grid gap-5 md:grid-cols-2">
            {view.state !== "knockout" && <Boosts view={view} />}
            <Holdbacks view={view} />
          </div>
          <div className="flex flex-wrap gap-x-6">
            <MoreLink href="/dashboard/aura/level-up">{AURA.nav.levelUp}</MoreLink>
            <MoreLink href="/dashboard/aura/history">{AURA.nav.history}</MoreLink>
          </div>
        </>
      )}
    </div>
  );
}
