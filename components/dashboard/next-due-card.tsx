"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { GlassButton } from "@/components/glass";
import { daysUntil, formatDateLong, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

interface NextDueCardProps {
  amount: number;
  dueDate: string;
  onRepay: () => void;
  /** nothing owed */
  clear?: boolean;
}

export function NextDueCard({ amount, dueDate, onRepay, clear }: NextDueCardProps) {
  if (clear) {
    return (
      <section aria-label="Next due" className="glass rounded-[24px] flex h-full items-center gap-4  p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div>
          <h2 className="font-bold">{COPY.dashboard.due.clearTitle}</h2>
          <p className="text-sm text-muted">{COPY.dashboard.due.clearBody}</p>
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
      className={cn(
        "card-shadow flex h-full flex-col justify-between gap-3 rounded-card border p-5",
        soon ? "border-warning/50 bg-warning-soft" : "border-line bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted">
            Next due
            <InfoTip text="The date by which this amount should be repaid." label="What is a due date?" />
          </h2>
          <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{formatINR(amount)}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
            soon ? "bg-warning text-background" : "bg-foreground/[0.07] text-foreground",
          )}
        >
          <CalendarClock className="size-3.5" aria-hidden /> {leftText}
        </span>
      </div>
      <dl className="divide-y divide-foreground/10 rounded-2xl bg-foreground/[0.07] px-4 text-sm">
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-muted">{COPY.dashboard.repay.total}</dt>
          <dd className="font-bold tabular-nums">{formatINR(amount)}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-muted">{COPY.dashboard.repay.dueDate}</dt>
          <dd className="font-bold">{formatDateLong(dueDate)}</dd>
        </div>
      </dl>
      {soon && <p className="text-sm text-muted">{COPY.dashboard.due.soonHint}</p>}
      <GlassButton variant={soon ? "warning" : "default"} size="lg" className="mt-4 w-full" onClick={onRepay}>
        Repay {formatINR(amount)}
      </GlassButton>
    </section>
  );
}
