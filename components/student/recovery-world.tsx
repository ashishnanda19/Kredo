"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { RECOVER_W } from "@/lib/copy-demo";
import { recoveryPlan, type StepState } from "@/lib/domain/recovery";
import { isOpen } from "@/lib/domain/selectors";
import { QuestList } from "./quest-list";
import { RepaySheetWorld } from "./repay-sheet";
import { useWorldStudent } from "./use-student";

const ICON: Record<StepState, typeof Circle> = { done: CheckCircle2, next: CircleDot, waiting: Circle };

/** Blocked and recovery: a calm explanation, ordered steps, progress to the minimum and an honest estimate. */
export function RecoveryWorld() {
  const { world, studentId } = useWorldStudent();
  const [repay, setRepay] = useState(false);
  if (!studentId) return null;
  const plan = recoveryPlan(world, studentId);

  if (!plan.blocked)
    return (
      <GlassCard radius="xl" strength="strong" className="mx-auto max-w-md p-7 text-center" data-testid="recovery-ok">
        <h1 className="text-2xl font-extrabold tracking-tight">{RECOVER_W.okTitle}</h1>
        <p className="mt-2 text-ink-2">{RECOVER_W.okBody}</p>
        <GlassButton asChild className="mt-5"><Link href="/dashboard">{RECOVER_W.home}</Link></GlassButton>
      </GlassCard>
    );

  const pct = Math.min(100, Math.round((plan.aura / plan.threshold) * 100));
  const open = Object.values(world.loans).filter((l) => l.studentId === studentId && isOpen(l) && plan.overdueLoans.some((o) => o.id === l.id));
  return (
    <div className="space-y-5" data-testid="recovery-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{RECOVER_W.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{RECOVER_W.intro}</p>
        <p className="mt-2 text-sm" data-testid="blocked-reason">{plan.blocked.message}</p>
      </div>

      <GlassCard radius="lg" className="p-5">
        <div role="img" aria-label={RECOVER_W.progress(plan.aura, plan.threshold)}>
          <span className="block h-2 overflow-hidden rounded-full bg-ink/15"><span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></span>
          <p className="mt-1.5 text-xs text-ink-2" data-testid="recovery-progress">{RECOVER_W.progress(plan.aura, plan.threshold)}</p>
        </div>
        <p className="mt-3 text-sm"><span className="font-semibold">{RECOVER_W.estimate}: </span><span data-testid="estimate">{plan.estimate}</span></p>
      </GlassCard>

      <ol className="space-y-3" data-testid="recovery-steps">
        {plan.steps.map((s, i) => {
          const Icon = ICON[s.state];
          return (
            <li key={s.id} data-testid={`step-${s.id}`} data-state={s.state}>
              <GlassCard radius="lg" className="p-5">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{i + 1}. {s.title} <span className="ml-1 text-xs font-medium text-ink-2">{RECOVER_W.stepState[s.state]}</span></p>
                    <p className="mt-0.5 text-sm text-ink-2">{s.body}</p>
                    {s.id === "clear_overdue" && s.state === "next" && <GlassButton className="mt-3" data-testid="recovery-repay" onClick={() => setRepay(true)}>{RECOVER_W.repay}</GlassButton>}
                    {s.id === "quests" && s.state !== "waiting" && <div className="mt-2"><QuestList studentId={studentId} quests={plan.quests.filter((q) => q.manual)} /></div>}
                    {s.id === "micro_spend" && s.state === "next" && <GlassButton asChild className="mt-3"><Link href="/dashboard/pay?micro=1" data-testid="micro-link">{RECOVER_W.micro}</Link></GlassButton>}
                  </div>
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ol>
      <RepaySheetWorld open={repay} onOpenChange={setRepay} loans={open} />
    </div>
  );
}
