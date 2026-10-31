"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { CountUp } from "@/components/shared/count-up";
import { InfoTip } from "@/components/shared/info-tip";
import { ProgressRing } from "@/components/shared/progress-ring";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { student } from "@/lib/mock-data";

interface LimitHeroCardProps {
  used?: number;
  /** bumps each time the limit-unlock replay fires: the number gets a haptic-style pulse */
  pulseKey?: number;
  onReplay?: () => void;
}

export function LimitHeroCard({ used = student.used, pulseKey = 0, onReplay }: LimitHeroCardProps) {
  const d = COPY.dashboard;
  const limit = student.limit;
  const avail = limit - used;
  const pct = used / limit;

  return (
    <GlassCard role="region" aria-label="Credit limit" radius="xl" strength="strong" glow="violet" className="relative flex h-full flex-col justify-between gap-5 overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-neon-violet/30 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            {d.available}
            <InfoTip text={d.availableTip} label="What is available limit?" />
          </p>
          <motion.p
            key={pulseKey}
            animate={pulseKey ? { scale: [1, 1.12, 0.98, 1] } : undefined}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ transformOrigin: "left center" }}
            className="mt-1 whitespace-nowrap text-[2.1rem] font-extrabold leading-none tracking-tight tabular-nums drop-shadow-[0_0_22px_var(--glow)] min-[400px]:text-[2.6rem] sm:text-5xl"
          >
            <CountUp value={avail} format={formatINR} />
          </motion.p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
            of {formatINR(limit)} {d.totalLimit}
            <InfoTip text={d.totalLimitTip} label="What is a total limit?" />
          </p>
        </div>
        <ProgressRing value={pct} size={96} stroke={10} label={`${Math.round(pct * 100)} percent of your limit used`}>
          <div>
            <p className="text-xl font-extrabold tabular-nums">{Math.round(pct * 100)}%</p>
            <p className="text-[11px] text-muted">used</p>
          </div>
        </ProgressRing>
      </div>
      <div className="relative flex flex-col gap-3 border-t border-foreground/15 pt-4 text-sm min-[430px]:flex-row min-[430px]:items-end min-[430px]:justify-between">
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-muted">{d.used}</dt>
            <dd className="font-bold tabular-nums">{formatINR(used)}</dd>
          </div>
          <div>
            <dt className="text-muted">Total limit</dt>
            <dd className="font-bold tabular-nums">{formatINR(limit)}</dd>
          </div>
        </dl>
        {onReplay && (
          <GlassButton variant="soft" size="sm" onClick={onReplay}>
            <Sparkles className="size-4" aria-hidden /> {d.replay}
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
}
