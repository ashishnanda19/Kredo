"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Confetti } from "@/components/verify/confetti";
import { AURA } from "@/lib/copy-aura";
import { formatDateLong } from "@/lib/format";
import type { AuraView } from "@/lib/score/types";
import { useAura, useAuraHistory, useWhatIf } from "@/lib/score/use-aura";
import { rupees } from "@/lib/score/view";
import { useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { AuraSkeleton, NoScore, SampleNote, UnavailableBanner } from "./parts";

const T = AURA.levelUp;

/** True once, the first time `done` is seen in this browser (confetti only for a quest that really moved Aura). */
function useCelebrateOnce(key: string, done: boolean) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!done) return;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    // remembered when it actually shows, so a cancelled effect (React strict mode) does not swallow it
    const on = setTimeout(() => {
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* storage unavailable: it may show again, which is harmless */
      }
      setShow(true);
    }, 0);
    const off = setTimeout(() => setShow(false), 4000);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [key, done]);
  return show;
}

function Quests() {
  const { history } = useAuraHistory(180);
  const reminder = useStore((s) => s.profile.notif.push || s.profile.notif.sms);
  const verified = useStore((s) => s.verification.status === "accepted" && s.kyc.status === "verified");
  const statement = useStore((s) => s.aura.statementReviewed);
  const markStatement = useStore((s) => s.markStatementReviewed);
  const early = Boolean(history?.markers.some((m) => m.kind === "repaid_early"));
  const celebrate = useCelebrateOnce("kredo-aura-early-quest", early);

  // only early repayment really moves Aura (through closure quality); the rest earn a badge, never fake points
  const quests = [
    { id: "repay_early", ...T.quests.repay_early, isDone: early, reward: T.auraChip },
    { id: "reminder", ...T.quests.reminder, isDone: reminder, reward: T.badge },
    { id: "verify", ...T.quests.verify, isDone: verified, reward: T.badge },
    { id: "statement", ...T.quests.statement, isDone: statement, reward: T.badge },
  ];
  const done = quests.filter((q) => q.isDone).length;

  return (
    <GlassCard radius="lg" role="region" aria-label={T.questsTitle} className="p-5">
      {celebrate && <Confetti count={36} />}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{T.questsTitle}</h2>
        <span className="text-xs font-semibold text-ink-2 tabular-nums">{done} of {quests.length}</span>
      </div>
      <Progress value={(done / quests.length) * 100} className="mt-3" label={`${done} of ${quests.length} quests done`} />
      <ul className="mt-4 space-y-3">
        {quests.map((q) => (
          <li key={q.id} className="flex items-start gap-3">
            {q.isDone ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok-text" aria-hidden /> : <Circle className="mt-0.5 size-5 shrink-0 text-ink-3" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{q.title}<span className="sr-only">{q.isDone ? ", done" : ", not done yet"}</span></p>
              {q.isDone && <p className="text-xs text-ink-2">{q.done}</p>}
              {!q.isDone && q.id === "statement" && (
                <Link href="/dashboard/loans" onClick={markStatement} className="text-xs font-semibold text-info-text underline-offset-4 hover:underline">{T.quests.statement.cta}</Link>
              )}
            </div>
            {q.isDone && (
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", q.reward === T.auraChip ? "bg-accent-soft text-ink" : "bg-card text-ink-2")}>{q.reward}</span>
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function Ladder({ view }: { view: AuraView }) {
  const { level, next, ladder } = view.limit;
  const current = level ? Number(level.slice(1)) : 0;
  const nextLine = !next
    ? current ? T.top : T.noLevel
    : next.cyclesNeeded > 0
      ? T.cyclesTo(next.cyclesNeeded, rupees(next.amountPaise))
      : next.blockers[0] ?? T.cyclesTo(1, rupees(next.amountPaise));
  return (
    <GlassCard radius="lg" role="region" aria-label={T.ladderTitle} className="p-5" data-testid="aura-ladder">
      <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{T.ladderTitle}</h2>
      <p className="mt-1 text-sm font-semibold">{nextLine}</p>
      <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ladder.map((l, i) => {
          const n = i + 1;
          const here = n === current;
          return (
            <li key={l.level} aria-current={here ? "step" : undefined} className={cn("rounded-2xl px-3 py-2.5 text-center", here ? "bg-accent text-accent-ink" : n < current ? "bg-ink/10" : "bg-card text-ink-2")}>
              <div className="text-xs font-semibold">{l.level}</div>
              <div className="text-sm font-semibold tabular-nums">{rupees(l.amountPaise)}</div>
              {here && <div className="text-[10px] font-semibold uppercase tracking-wide">{T.current}</div>}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-ink-2">{T.cleanCycle}</p>
      <p className="mt-1 text-xs text-ink-2">{AURA.partnerDecides}</p>
    </GlassCard>
  );
}

function WhatIf({ view }: { view: AuraView }) {
  const loan = view.openLoans.find((l) => l.dpd === 0);
  const [days, setDays] = useState(2);
  const { status, whatIf, run } = useWhatIf();

  useEffect(() => {
    if (!loan || view.notice?.kind === "knockout") return;
    const id = setTimeout(() => void run(days), 250);
    return () => clearTimeout(id);
  }, [days, loan, run, view.notice?.kind]);

  return (
    <GlassCard radius="lg" role="region" aria-label={T.whatIfTitle} className="p-5" data-testid="aura-what-if">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{T.whatIfTitle}</h2>
        <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warn-text">{AURA.estimate}</span>
      </div>
      {!loan || view.notice?.kind === "knockout" ? (
        <p className="mt-2 text-sm text-ink-2">{T.whatIfNone}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-2">{T.whatIfBody(rupees(loan.outstandingPaise), formatDateLong(loan.dueDate))}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{T.whatIfDays(days)}</span>
            </div>
            <Slider min={0} max={5} step={1} value={[days]} onValueChange={(v) => setDays(v[0])} aria-label={T.whatIfLabel} />
          </div>
          <div role="status" aria-live="polite" className="mt-2 min-h-14 rounded-2xl bg-ink/[0.06] px-4 py-3 text-sm">
            {status === "loading" && <Loader2 className="size-4 animate-spin text-ink-2" aria-label="Working out the estimate" />}
            {status === "ok" && whatIf && (
              <>
                <p className="font-semibold">{T.whatIfResult(whatIf.projected, formatDateLong(whatIf.at))} <span className="font-normal text-ink-2">({T.whatIfNow(whatIf.current)})</span></p>
                {whatIf.change <= 0 && <p className="mt-1 text-xs text-ink-2">{T.whatIfFlat}</p>}
              </>
            )}
            {status === "busy" && <p>{T.whatIfBusy}</p>}
            {(status === "unavailable" || status === "no_loan") && <p>{status === "no_loan" ? T.whatIfNone : T.whatIfError}</p>}
          </div>
          <p className="mt-2 text-xs text-ink-2">{AURA.estimate}. {AURA.partnerDecides}</p>
        </>
      )}
    </GlassCard>
  );
}

export function LevelUp() {
  const { status, view, source } = useAura();
  if (status === "loading") return <AuraSkeleton />;
  if (status === "no_score") return <NoScore />;
  return (
    <div className="space-y-5" data-testid="aura-level-up">
      <SampleNote source={source} />
      {status === "unavailable" && <UnavailableBanner updatedAt={view?.updatedAt ?? null} />}
      <Quests />
      {view && (
        <>
          <Ladder view={view} />
          <WhatIf view={view} />
        </>
      )}
    </div>
  );
}
