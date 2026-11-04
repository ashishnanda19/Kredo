"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { GlassButton } from "@/components/glass";
import { daysUntil, formatDateLong, formatINR } from "@/lib/format";
import { COPY } from "@/lib/copy";

interface NextDueCardProps {
  amount: number;
  dueDate: string;
  onRepay: () => void;
  /** nothing owed */
  clear?: boolean;
}

/**
 * Next due on an ink card in both themes (like the landing page's dark sections), with the brand yellow for the
 * days-left chip and the repay button. No alarm colours: the date and amount do the talking.
 */
export function NextDueCard({ amount, dueDate, onRepay, clear }: NextDueCardProps) {
  if (clear) {
    return (
      <section aria-label="Next due" className="glass flex h-full items-center gap-4 rounded-[24px] p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-success-soft text-ok-text">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{COPY.dashboard.due.clearTitle}</h2>
          <p className="text-sm text-ink-2">{COPY.dashboard.due.clearBody}</p>
        </div>
      </section>
    );
  }

  const left = daysUntil(dueDate);
  const soon = left <= 5;
  const leftText = left <= 0 ? "Due today" : left === 1 ? "1 day left" : `${left} days left`;

  return (
    <section
      aria-label="Next due"
      className="relative isolate flex h-full flex-col justify-between gap-5 overflow-hidden rounded-[24px] bg-[#0b0b0c] p-6 text-white ring-1 ring-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60 [&_button]:text-white/60 [&_button:hover]:text-white">
            {COPY.dashboard.due.title}
            <InfoTip text={COPY.dashboard.due.tip} label="What is a due date?" />
          </h2>
          <p className="mt-3 text-[clamp(2.5rem,4.6vw,3.25rem)] font-semibold leading-none tracking-[-0.045em] tabular-nums">{formatINR(amount)}</p>
        </div>
        <span
          className={
            soon
              ? "inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-[#0b0b0c]"
              : "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          }
        >
          <CalendarClock className="size-3.5" aria-hidden /> {leftText}
        </span>
      </div>
      <dl className="divide-y divide-white/10 rounded-[16px] bg-white/[0.06] px-4 text-sm">
        <div className="flex items-center justify-between py-3">
          <dt className="text-white/60">{COPY.dashboard.repay.total}</dt>
          <dd className="font-semibold tabular-nums">{formatINR(amount)}</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-white/60">{COPY.dashboard.repay.dueDate}</dt>
          <dd className="font-semibold">{formatDateLong(dueDate)}</dd>
        </div>
      </dl>
      {soon && <p className="text-sm text-white/60">{COPY.dashboard.due.soonHint}</p>}
      <GlassButton variant="accent" size="lg" className="w-full" onClick={onRepay}>
        Repay {formatINR(amount)}
      </GlassButton>
    </section>
  );
}
