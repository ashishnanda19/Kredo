"use client";

import { useState } from "react";
import { BellRing, CalendarClock } from "lucide-react";
import { Disclosure } from "@/components/shared/demo-tag";
import { InfoTip } from "@/components/shared/info-tip";
import { SuccessCheck } from "@/components/shared/success-check";
import { GlassButton } from "@/components/glass";
import { GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { daysUntil, formatDateLong, formatINR } from "@/lib/format";
import { notifications, score, student } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function Row({ label, value, strong, tip }: { label: string; value: React.ReactNode; strong?: boolean; tip?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", strong ? "text-[16px] font-semibold tracking-[-0.015em]" : "text-sm")}>
      <dt className={cn("flex items-center gap-1.5", !strong && "text-ink-2")}>
        {label}
        {tip && <InfoTip text={tip} />}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Repay sheet: shows the total and due date BEFORE the confirm button. */
export function RepaySheet({
  open,
  onOpenChange,
  amount,
  dueDate,
  title,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  amount: number;
  dueDate: string;
  title: string;
}) {
  const [phase, setPhase] = useState<"review" | "busy" | "done">("review");
  const left = daysUntil(dueDate);

  function change(o: boolean) {
    onOpenChange(o);
    if (!o) setTimeout(() => setPhase("review"), 250);
  }

  function confirm() {
    setPhase("busy");
    setTimeout(() => setPhase("done"), 1100);
  }

  return (
    <GlassSheet open={open} onOpenChange={change}>
      <GlassSheetContent>
        {phase === "done" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <SuccessCheck />
            <GlassSheetTitle className="mt-5 text-2xl font-semibold tracking-[-0.035em]">{COPY.dashboard.repay.doneTitle}</GlassSheetTitle>
            <GlassSheetDescription className="mt-1 text-sm text-ink-2">{formatINR(amount)} repaid. {COPY.dashboard.repay.doneBody}</GlassSheetDescription>
            <GlassButton className="mt-6 w-full" onClick={() => change(false)}>
              Done
            </GlassButton>
          </div>
        ) : (
          <div>
            <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">Repay now</GlassSheetTitle>
            <GlassSheetDescription className="mt-1 text-sm text-ink-2">{title}</GlassSheetDescription>
            <dl className="mt-4 divide-y divide-hairline rounded-card border border-hairline px-4">
              <Row label="Amount due" value={formatINR(amount)} tip="What you owe for these spends." />
              <Row label="Due date" value={`${formatDateLong(dueDate)} (${left} days left)`} tip="Pay by this date to stay on track." />
              <Row label="Total to repay" value={formatINR(amount)} strong />
            </dl>
            <GlassButton size="lg" className="mt-5 w-full" onClick={confirm} disabled={phase === "busy"}>
              {phase === "busy" ? "Processing…" : `Repay ${formatINR(amount)}`}
            </GlassButton>
            <Disclosure className="mt-3 justify-center" />
          </div>
        )}
      </GlassSheetContent>
    </GlassSheet>
  );
}

const OPTIONS = [4000, 5000, 6000];

export function LimitIncreaseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pick, setPick] = useState(OPTIONS[0]);
  const [done, setDone] = useState(false);

  function change(o: boolean) {
    onOpenChange(o);
    if (!o) setTimeout(() => setDone(false), 250);
  }

  return (
    <GlassSheet open={open} onOpenChange={change}>
      <GlassSheetContent>
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <SuccessCheck />
            <GlassSheetTitle className="mt-5 text-2xl font-semibold tracking-[-0.035em]">Request received</GlassSheetTitle>
            <GlassSheetDescription className="mt-1 text-sm text-ink-2">Our lending partner will review it. Increases aren’t guaranteed. (Demo only.)</GlassSheetDescription>
            <GlassButton className="mt-6 w-full" onClick={() => change(false)}>
              Got it
            </GlassButton>
          </div>
        ) : (
          <div>
            <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">Request a higher limit</GlassSheetTitle>
            <GlassSheetDescription className="mt-1 text-sm text-ink-2">
              Your score is {score.current}. Pick what you’d like. The lending partner decides, and it’s not guaranteed.
            </GlassSheetDescription>
            <div role="radiogroup" aria-label="Requested limit" className="mt-4 grid grid-cols-3 gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={pick === o}
                  onClick={() => setPick(o)}
                  className={cn(
                    "min-h-12 rounded-2xl border text-sm font-semibold transition-colors",
                    pick === o ? "border-ink bg-accent-soft text-ink" : "border-hairline bg-ink/[0.07]",
                  )}
                >
                  {formatINR(o)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-2">{COPY.legal.nudge} A bigger limit means more to repay.</p>
            <GlassButton size="lg" className="mt-5 w-full" onClick={() => setDone(true)}>
              Send request
            </GlassButton>
            <Disclosure className="mt-3 justify-center" />
          </div>
        )}
      </GlassSheetContent>
    </GlassSheet>
  );
}

export function NotificationsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <GlassSheet open={open} onOpenChange={onOpenChange}>
      <GlassSheetContent>
        <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">Notifications</GlassSheetTitle>
        <GlassSheetDescription className="sr-only">Recent updates for {student.firstName}</GlassSheetDescription>
        <ul className="mt-4 space-y-2">
          {notifications.map((n, i) => (
            <li key={n.id} className="flex gap-3 rounded-2xl bg-ink/[0.07] p-4">
              <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", i === 0 ? "bg-warning-soft text-warn-text" : "bg-accent-soft text-ink")}>
                {i === 0 ? <CalendarClock className="size-4" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-ink-2">{n.body}</p>
                <p className="mt-1 text-xs text-ink-2">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </GlassSheetContent>
    </GlassSheet>
  );
}
