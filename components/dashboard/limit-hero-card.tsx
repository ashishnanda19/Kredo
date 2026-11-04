"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CountUp } from "@/components/shared/count-up";
import { InfoTip } from "@/components/shared/info-tip";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { student } from "@/lib/mock-data";

interface LimitHeroCardProps {
  used?: number;
  /** bumps each time the limit-unlock replay fires: the number gets a haptic-style pulse */
  pulseKey?: number;
  onReplay?: () => void;
}

/**
 * The available limit on a flat signal-yellow panel (no gradient, no grain) with ink type, like the landing hero. The
 * usage meter fills segment by segment on load. `theme-light` keeps tooltips inside it on light values in both themes.
 */
export function LimitHeroCard({ used = student.used, pulseKey = 0, onReplay }: LimitHeroCardProps) {
  const d = COPY.dashboard;
  const limit = student.limit;
  const avail = limit - used;
  const pct = used / limit;
  const SEGMENTS = 24;
  const filled = Math.round(pct * SEGMENTS);

  return (
    <section
      role="region"
      aria-label="Credit limit"
      className="theme-light relative flex h-full min-h-[300px] flex-col justify-between gap-8 overflow-hidden rounded-[24px] bg-accent p-6 text-[#0b0b0c] sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0b0b0c]/65">
          {d.available}
          <InfoTip text={d.availableTip} label="What is available limit?" />
        </p>
        <span className="rounded-full bg-[#0b0b0c]/10 px-3 py-1 text-[12px] font-semibold tabular-nums">{d.usedPct(Math.round(pct * 100))}</span>
      </div>

      <div>
        <motion.p
          key={pulseKey}
          animate={pulseKey ? { scale: [1, 1.06, 0.99, 1] } : undefined}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{ transformOrigin: "left center" }}
          className="whitespace-nowrap text-[clamp(3rem,6.4vw,4.75rem)] font-semibold leading-[0.9] tracking-[-0.05em] tabular-nums"
        >
          <CountUp value={avail} format={formatINR} />
        </motion.p>
        <p className="mt-3 flex items-center gap-1.5 text-[15px] font-medium text-[#0b0b0c]/70">
          of {formatINR(limit)} {d.totalLimit}
          <InfoTip text={d.totalLimitTip} label="What is a total limit?" />
        </p>

        <div role="img" aria-label={`${Math.round(pct * 100)} percent of your limit used`} className="mt-5 flex gap-[3px]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <motion.span
              key={i}
              className={`h-2.5 flex-1 rounded-[3px] ${i < filled ? "bg-[#0b0b0c]" : "bg-[#0b0b0c]/15"}`}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.025 }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#0b0b0c]/15 pt-4 min-[430px]:flex-row min-[430px]:items-end min-[430px]:justify-between">
        <dl className="grid grid-cols-2 gap-8">
          <div>
            <dt className="text-[13px] text-[#0b0b0c]/65">{d.used}</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] tabular-nums">{formatINR(used)}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#0b0b0c]/65">Total limit</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] tabular-nums">{formatINR(limit)}</dd>
          </div>
        </dl>
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white/45 px-4 text-[13.5px] font-semibold shadow-[inset_0_0_0_1px_rgba(11,11,12,0.1)] transition-[background-color,transform] hover:bg-white/65 active:scale-[0.97] min-[430px]:self-auto"
          >
            <Sparkles className="size-4" aria-hidden /> {d.replay}
          </button>
        )}
      </div>
    </section>
  );
}
