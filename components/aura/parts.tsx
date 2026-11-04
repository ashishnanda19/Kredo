"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CloudOff, Flame, Info, PauseCircle, ShieldAlert, Sparkles } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { CountUp } from "@/components/shared/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { AURA } from "@/lib/copy-aura";
import { formatDateLong } from "@/lib/format";
import type { AuraView } from "@/lib/score/types";
import { cn } from "@/lib/utils";

/** The bureau disclaimer. Every screen that shows Aura renders this. */
export function AuraDisclaimer({ className }: { className?: string }) {
  return (
    <p role="note" data-testid="aura-disclaimer" className={cn("flex items-start gap-2 rounded-2xl border border-ink/15 bg-ink/[0.05] px-4 py-3 text-sm font-semibold", className)}>
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-info-text" aria-hidden /> {AURA.disclaimer}
    </p>
  );
}

const TABS = [
  { href: "/dashboard/aura", label: AURA.nav.home },
  { href: "/dashboard/aura/history", label: AURA.nav.history },
  { href: "/dashboard/aura/level-up", label: AURA.nav.levelUp },
  { href: "/dashboard/aura/wrapped", label: AURA.nav.wrapped },
  { href: "/dashboard/aura/about", label: AURA.nav.about },
];

export function AuraNav() {
  const path = usePathname();
  return (
    <nav aria-label="Aura" className="scrollbar-none -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1">
      {TABS.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors", on ? "bg-pill text-pill-fg" : "bg-card text-ink-2 hover:text-ink")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

const R = 84;
const C = 2 * Math.PI * R;
const SWEEP = 0.75;

/** 0 to 100 ring with an animated count-up (reduced motion: the final value at once, no sweep). */
export function AuraGauge({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value)) / 100;
  const a = ((135 + 270 * v) * Math.PI) / 180;
  return (
    <div role="img" aria-label={label} className={cn("relative mx-auto aspect-square w-full max-w-[240px]", className)}>
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
        <circle cx="100" cy="100" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-hairline" strokeDasharray={`${C * SWEEP} ${C}`} transform="rotate(135 100 100)" />
        <motion.circle
          cx="100" cy="100" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-ink" transform="rotate(135 100 100)"
          initial={{ strokeDasharray: `0 ${C}` }}
          animate={{ strokeDasharray: `${C * SWEEP * v} ${C}` }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
        <motion.circle r="9" className="fill-accent stroke-page" strokeWidth="4" initial={false} animate={{ cx: 100 + R * Math.cos(a), cy: 100 + R * Math.sin(a) }} transition={{ type: "spring", stiffness: 70, damping: 18 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div data-testid="aura-number" className="text-6xl font-semibold leading-none tracking-[-0.045em] tabular-nums">
            <CountUp value={value} immediate />
          </div>
          <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">Aura</div>
        </div>
      </div>
      <span aria-hidden className="absolute bottom-[8%] left-[22%] text-xs text-ink-2">0</span>
      <span aria-hidden className="absolute bottom-[8%] right-[19%] text-xs text-ink-2">100</span>
    </div>
  );
}

export function StreakChip({ n }: { n: number }) {
  if (n < 1) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-ink">
      <Flame className="size-3.5" aria-hidden /> {AURA.streak(n)}
    </span>
  );
}

export function FreshSpawnBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-ok-text">
      <Sparkles className="size-3.5" aria-hidden /> {AURA.freshSpawn.name}
    </span>
  );
}

/** Tier card. The fresh-spawn line replaces the tier line for thin files. Never shown next to a knockout. */
export function TierCard({ view }: { view: AuraView }) {
  return (
    <div className="rounded-2xl bg-ink/[0.06] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{view.tier.name}</h2>
        {view.freshSpawn && <FreshSpawnBadge />}
        <StreakChip n={view.streak} />
      </div>
      <p className="mt-1 text-sm text-ink-2">{view.freshSpawn ? AURA.freshSpawn.line : view.tier.line}</p>
    </div>
  );
}

/** Knockout, hold or frozen consent: plain and calm, with one action. No tier slang next to it. */
export function NoticeCard({ notice }: { notice: NonNullable<AuraView["notice"]> }) {
  const Icon = notice.kind === "consent" ? Info : PauseCircle;
  return (
    <GlassCard radius="lg" role="region" aria-label={notice.title} data-testid="aura-notice" className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warn-text"><Icon className="size-5" aria-hidden /></span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{notice.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{notice.body}</p>
          <GlassButton asChild size="sm" className="mt-3">
            <Link href={notice.action.href}>{notice.action.label}</Link>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}

export function AuraSkeleton() {
  return (
    <div role="status" aria-label={AURA.states.loading} data-testid="aura-loading" className="space-y-4">
      <Skeleton className="h-72 w-full rounded-[24px]" />
      <Skeleton className="h-28 w-full rounded-[20px]" />
      <Skeleton className="h-28 w-full rounded-[20px]" />
    </div>
  );
}

export function NoScore() {
  return (
    <GlassCard radius="lg" className="p-6 text-center" data-testid="aura-no-score">
      <Sparkles className="mx-auto size-8 text-ink-2" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold">{AURA.states.noScoreTitle}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">{AURA.states.noScoreBody}</p>
    </GlassCard>
  );
}

/** Service down: say so plainly and show the last known Aura's date. */
export function UnavailableBanner({ updatedAt }: { updatedAt: string | null }) {
  return (
    <div role="status" data-testid="aura-unavailable" className="flex items-start gap-3 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warn-text">
      <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{AURA.states.unavailableTitle}</p>
        <p>{updatedAt ? AURA.states.unavailableBody(formatDateLong(updatedAt)) : AURA.states.unavailableNoCache}</p>
      </div>
    </div>
  );
}


export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">
      {children} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
