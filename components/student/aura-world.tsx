"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { displayedEffect } from "@/lib/aura/engine";
import { AURA_W, TIER_LABEL } from "@/lib/copy-demo";
import { ladderView } from "@/lib/domain/limit";
import { questViews, recoveryPlan } from "@/lib/domain/recovery";
import { blockedReason, studentEvents, studentState } from "@/lib/domain/selectors";
import { fmtDate, istDate } from "@/lib/domain/time";
import { QuestList } from "./quest-list";
import { useWorldStudent } from "./use-student";

/** The Aura screen: the score, what to do next, the quests, and the last ten things that moved it, each with its reason. */
export function AuraWorld() {
  const { world, studentId } = useWorldStudent();
  if (!studentId) return null;
  const st = studentState(world, studentId);
  const blocked = blockedReason(world, studentId);
  const plan = recoveryPlan(world, studentId);
  const quests = questViews(world, studentId);
  const ladder = ladderView(world, studentId);
  const events = [...studentEvents(world, studentId)].filter((e) => e.at <= world.clock.now).sort((a, b) => b.at - a.at || b.id.localeCompare(a.id)).slice(0, 10);
  const openQuest = quests.find((q) => q.manual && q.status === "available");

  const nextBest = plan.overdueOwed > 0 ? AURA_W.next.overdue(plan.overdueOwed) : blocked ? AURA_W.next.blocked : openQuest ? AURA_W.next.quest(openQuest.title, openQuest.aura) : ladder.nextLimit ? AURA_W.next.stepUp(ladder.nextLimit) : AURA_W.next.steady;

  return (
    <div className="space-y-5" data-testid="aura-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{AURA_W.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{AURA_W.sub}</p>
      </div>

      <GlassCard radius="xl" strength="strong" className="p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-6xl font-extrabold tabular-nums tracking-tight" data-testid="aura-number">{st.aura}</p>
            <p className="text-sm text-ink-2">out of 100</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-2">{AURA_W.tier}</p>
            <p className="text-lg font-bold" data-testid="aura-tier-name">{TIER_LABEL[st.tier] ?? st.tier}</p>
            <p className="text-sm text-ink-2" data-testid="aura-streak">{AURA_W.streak(st.consecutiveOnTime)}</p>
          </div>
        </div>
        <div className="mt-4" role="img" aria-label={`Aura ${st.aura} of 100`}>
          <span className="block h-2 overflow-hidden rounded-full bg-ink/15"><span className="block h-full rounded-full bg-accent" style={{ width: `${st.aura}%` }} /></span>
        </div>
        <div className="mt-4 rounded-2xl bg-card p-3 text-sm" data-testid="next-best">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{AURA_W.nextBest}</p>
          <p className="mt-0.5 font-semibold">{nextBest}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/dashboard/limit" className="underline">{AURA_W.limitLink}</Link>
          {(blocked || st.hasPriorDefault) && <Link href="/dashboard/recovery" className="underline" data-testid="recovery-link">{AURA_W.recoveryLink}</Link>}
        </div>
      </GlassCard>

      <GlassCard radius="lg" className="p-5">
        <h2 className="text-base font-bold">{AURA_W.quests}</h2>
        <p className="text-xs text-ink-2">{AURA_W.questsSub}</p>
        <QuestList studentId={studentId} quests={quests} />
      </GlassCard>

      <GlassCard radius="lg" className="p-5">
        <h2 className="text-base font-bold">{AURA_W.history}</h2>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-2">{AURA_W.historyEmpty}</p>
        ) : (
          <ul className="divide-y divide-hairline" data-testid="aura-events">
            {events.map((e) => {
              const eff = displayedEffect(e, world.clock.now);
              const unscored = e.scored === false;
              return (
                <li key={e.id} data-testid="aura-event" className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{e.explanation}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{fmtDate(istDate(e.at))} · {e.reasonCode}{eff.weight < 1 && e.delta !== 0 ? ` · ${AURA_W.older}` : ""}{unscored ? ` · ${AURA_W.notScored}` : ""}</p>
                  </div>
                  <Badge tone={eff.shown > 0 ? "success" : eff.shown < 0 ? "danger" : "neutral"} data-testid="aura-effect">{AURA_W.effect(eff.shown)}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
      <p className="text-xs text-ink-2">{AURA_W.disclaimer}</p>
    </div>
  );
}
