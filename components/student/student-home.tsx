"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ScanLine } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { STUDENT, TIER_LABEL } from "@/lib/copy-demo";
import { amountDue, blockedReason, availableLimit, isOpen, loansOfStudent, nextDue, outstandingPrincipalOf, studentState } from "@/lib/domain/selectors";
import { fmtDate, fmtDateTime } from "@/lib/domain/time";
import { NotificationsTray, useUnread } from "./notifications-sheet";
import { LoanRow, StatusBadge } from "./loan-parts";
import { RepaySheetWorld } from "./repay-sheet";
import { useWorldStudent } from "./use-student";

export function CoinCard({ world, studentId }: { world: ReturnType<typeof useWorldStudent>["world"]; studentId: string }) {
  const t = STUDENT.coinCard;
  const st = studentState(world, studentId);
  const blocked = blockedReason(world, studentId);
  const avail = blocked ? 0 : availableLimit(world, studentId);
  const used = outstandingPrincipalOf(world, studentId);
  const pct = st.limit ? Math.min(100, Math.round((used / st.limit) * 100)) : 0;
  return (
    <GlassCard radius="xl" strength="strong" className="p-6" data-testid="coin-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{t.available}</p>
      <p data-testid="available-coins" className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight">{avail} <span className="text-lg font-semibold text-ink-2">{t.coins}</span></p>
      <p className="text-sm text-ink-2">{t.rupees(avail)}</p>
      <div className="mt-4" role="img" aria-label={`${t.inUse(used)} ${t.ofLimit(st.limit)}`}>
        <span className="block h-2 overflow-hidden rounded-full bg-ink/15"><span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></span>
        <p className="mt-1.5 flex justify-between text-xs text-ink-2"><span>{t.inUse(used)}</span><span data-testid="limit-total">{t.ofLimit(st.limit)}</span></p>
      </div>
      {blocked && (
        <div role="status" data-testid="blocked-note" className="mt-4 rounded-2xl bg-warning-soft p-3 text-sm text-warn-text">
          <p className="font-semibold">{t.blockedTitle}</p>
          <p>{blocked.message}</p>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-2">{t.note}</p>
    </GlassCard>
  );
}

export function StudentHome() {
  const { world, studentId, student } = useWorldStudent();
  const [repayOpen, setRepayOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const accountId = student?.accountId;
  const unread = useUnread(accountId);
  if (!studentId || !student || !accountId) return null;

  const st = studentState(world, studentId);
  const open = loansOfStudent(world, studentId).filter(isOpen);
  const due = nextDue(world, studentId);
  const recent = [...loansOfStudent(world, studentId)].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)).slice(0, 5);
  const lastRepay = world.repayments.filter((r) => r.studentId === studentId).sort((a, b) => b.at - a.at)[0];

  return (
    <div className="space-y-5" data-testid="student-home">
      <header className="space-y-4">
        <div className="flex items-center justify-between lg:hidden"><Logo href="/dashboard" /><ThemeToggle /></div>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-balance text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
            <span>{STUDENT.greeting(student.firstName)}</span> <span className="text-ink-2/80">{STUDENT.greetingSub}</span>
          </h1>
          <GlassButton variant="secondary" size="icon" aria-label={STUDENT.bell(unread)} data-testid="bell" onClick={() => setBell(true)} className="relative shrink-0">
            <Bell className="size-5" />
            {unread > 0 && <span aria-hidden className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-card bg-accent" />}
          </GlassButton>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <CoinCard world={world} studentId={studentId} />
        <div className="space-y-5">
          <GlassButton asChild size="lg" variant="accent" className="w-full"><Link href="/dashboard/pay" data-testid="scan-pay"><ScanLine className="size-5" aria-hidden /> {STUDENT.scan}</Link></GlassButton>

          <GlassCard radius="lg" className="p-5" data-testid="due-soon">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2">{STUDENT.dueSoon}</h2>
            {due ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tabular-nums">₹{amountDue(due)}</p>
                  <p className="text-sm text-ink-2">{STUDENT.dueOn(fmtDate(due.dueDate))} · {world.vendors[due.vendorId]?.stallName}</p>
                  <div className="mt-1"><StatusBadge loan={due} now={world.clock.now} /></div>
                </div>
                <GlassButton data-testid="repay-open" onClick={() => setRepayOpen(true)}>{STUDENT.repay}</GlassButton>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-2">{STUDENT.dueNone}</p>
            )}
          </GlassCard>

          <GlassCard radius="lg" className="flex items-center justify-between gap-3 p-5" data-testid="aura-mini">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{STUDENT.aura.title}</p>
              <p className="text-3xl font-extrabold tabular-nums" data-testid="aura-value">{st.aura}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-2">{STUDENT.aura.tier}</p>
              <p className="font-semibold" data-testid="aura-tier">{TIER_LABEL[st.tier] ?? st.tier}</p>
              <p className="text-xs text-ink-2">{STUDENT.aura.note}</p>
            </div>
          </GlassCard>
        </div>

        <GlassCard radius="lg" className="p-5 md:col-span-2">
          <div className="flex items-baseline justify-between"><h2 className="text-base font-bold">{STUDENT.recent}</h2><Link href="/dashboard/loans" className="text-sm font-semibold underline">{STUDENT.allLoans}</Link></div>
          {recent.length === 0 ? <p className="py-6 text-center text-sm text-ink-2">{STUDENT.recentEmpty}</p> : <ul className="divide-y divide-hairline">{recent.map((l) => <LoanRow key={l.id} world={world} loan={l} />)}</ul>}
          {lastRepay && <p className="mt-2 text-xs text-ink-2">Last repayment: ₹{lastRepay.amount} on {fmtDateTime(lastRepay.at)}</p>}
        </GlassCard>
      </div>

      <RepaySheetWorld open={repayOpen} onOpenChange={setRepayOpen} loans={open} />
      <NotificationsTray open={bell} onOpenChange={setBell} accountId={accountId} />
    </div>
  );
}
