"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton, GlassCard } from "@/components/glass";
import { STUDENT } from "@/lib/copy-demo";
import { amountDue, isOpen } from "@/lib/domain/selectors";
import { fmtDate, fmtDateTime } from "@/lib/domain/time";
import { RepaySheetWorld } from "./repay-sheet";
import { StatusBadge } from "./loan-parts";
import { useWorldStudent } from "./use-student";

const t = STUDENT.loans;

function Row({ k, v, strong, testId }: { k: string; v: React.ReactNode; strong?: boolean; testId?: string }) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 ${strong ? "text-base font-bold" : "text-sm"}`}>
      <dt className={strong ? "" : "text-ink-2"}>{k}</dt>
      <dd data-testid={testId} className="text-right tabular-nums">{v}</dd>
    </div>
  );
}

/** One payment: what it cost, what is left, the repayments so far, and Repay. This is also the receipt. */
export function LoanDetailWorld({ id }: { id: string }) {
  const { world, studentId } = useWorldStudent();
  const [repay, setRepay] = useState(false);
  const loan = world.loans[id];
  if (!studentId) return null;
  if (!loan || loan.studentId !== studentId)
    return (
      <GlassCard radius="xl" className="p-8 text-center"><p className="text-sm text-ink-2">{t.notFound}</p><GlassButton asChild className="mt-4"><Link href="/dashboard/loans">{t.back}</Link></GlassButton></GlassCard>
    );
  const owed = amountDue(loan);
  const reps = world.repayments.filter((r) => r.loanId === id).sort((a, b) => a.at - b.at);
  return (
    <div className="space-y-5" data-testid="loan-detail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-semibold tracking-[-0.04em]">{t.detail}</h1>
          <p className="text-sm text-ink-2">{STUDENT.pay.receiptNo} {loan.id}</p>
        </div>
        <StatusBadge loan={loan} now={world.clock.now} />
      </div>
      <GlassCard radius="xl" strength="strong" className="px-5">
        <dl className="divide-y divide-hairline">
          <Row k={t.to} v={world.vendors[loan.vendorId]?.stallName} />
          <Row k={t.on} v={fmtDateTime(loan.createdAt)} />
          <Row k={t.principal} v={`₹${loan.coins}`} />
          <Row k={t.fee} v={`₹${loan.fee}`} />
          <Row k={t.interest} v={`₹${loan.interest}`} />
          <Row k={t.total} v={`₹${loan.totalRepayable}`} strong />
          <Row k="Repay by" v={fmtDate(loan.dueDate)} />
          <Row k={t.repaid} v={`₹${loan.repaid}`} />
          <Row k={t.stillOwed} v={`₹${owed}`} strong testId="still-owed" />
        </dl>
      </GlassCard>
      {isOpen(loan) && <GlassButton size="lg" className="w-full" data-testid="repay-loan" onClick={() => setRepay(true)}>{STUDENT.repay}</GlassButton>}
      {reps.length > 0 && (
        <GlassCard radius="lg" className="p-5">
          <h2 className="text-base font-bold">{t.statement}</h2>
          <ul data-testid="statement" className="mt-2 divide-y divide-hairline text-sm">
            {reps.map((r) => <li key={r.id} className="flex justify-between gap-3 py-2"><span>{fmtDateTime(r.at)}</span><span className="tabular-nums">{t.stmtPaid(r.amount)} (fee ₹{r.applied.fee}, interest ₹{r.applied.interest}, amount ₹{r.applied.principal})</span></li>)}
          </ul>
        </GlassCard>
      )}
      <p className="text-xs text-ink-2">{STUDENT.pay.stallNote}</p>
      <Link href="/dashboard/loans" className="inline-block text-sm font-semibold underline">{t.back}</Link>
      <RepaySheetWorld open={repay} onOpenChange={setRepay} loans={isOpen(loan) ? [loan] : []} focus={loan} />
    </div>
  );
}
