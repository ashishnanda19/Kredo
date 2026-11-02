"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton, GlassCard } from "@/components/glass";
import { STUDENT } from "@/lib/copy-demo";
import { amountDue, isOpen, loansOfStudent } from "@/lib/domain/selectors";
import { fmtDate } from "@/lib/domain/time";
import type { Loan } from "@/lib/domain/types";
import { LoanRow } from "./loan-parts";
import { RepaySheetWorld } from "./repay-sheet";
import { useWorldStudent } from "./use-student";

const t = STUDENT.loans;

/** Payments grouped by due date, open ones first. */
export function LoansWorld() {
  const { world, studentId } = useWorldStudent();
  const [repay, setRepay] = useState(false);
  if (!studentId) return null;
  const all = loansOfStudent(world, studentId);
  const open = all.filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const closed = all.filter((l) => !isOpen(l)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  const groups = [...open.reduce((m, l) => m.set(l.dueDate, [...(m.get(l.dueDate) ?? []), l]), new Map<string, Loan[]>())];
  const owed = open.reduce((s, l) => s + amountDue(l), 0);
  return (
    <div className="space-y-5" data-testid="loans-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{t.sub}</p>
      </div>
      {all.length === 0 ? (
        <GlassCard radius="xl" className="p-8 text-center text-sm text-ink-2">{t.empty}</GlassCard>
      ) : (
        <>
          {open.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p data-testid="owed-total" className="text-lg font-bold tabular-nums">{t.dueTotal(owed)}</p>
              <GlassButton data-testid="repay-all" onClick={() => setRepay(true)}>{STUDENT.repay}</GlassButton>
            </div>
          )}
          {groups.map(([date, ls]) => (
            <GlassCard key={date} radius="lg" className="p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2">Due {fmtDate(date)}</h2>
              <ul className="divide-y divide-hairline">{ls.map((l) => <LoanRow key={l.id} world={world} loan={l} />)}</ul>
            </GlassCard>
          ))}
          {closed.length > 0 && (
            <GlassCard radius="lg" className="p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2">{t.closed}</h2>
              <ul className="divide-y divide-hairline">{closed.map((l) => <LoanRow key={l.id} world={world} loan={l} />)}</ul>
            </GlassCard>
          )}
        </>
      )}
      <RepaySheetWorld open={repay} onOpenChange={setRepay} loans={open} />
      <Link href="/dashboard" className="inline-block text-sm font-semibold underline">Back home</Link>
    </div>
  );
}
