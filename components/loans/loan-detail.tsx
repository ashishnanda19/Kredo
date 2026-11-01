"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/header";
import { GlassButton, GlassCard } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { PAYMENTS } from "@/lib/mock-data";
import { nextInstalment, useStore } from "@/lib/store/store";
import { OutstandingCard } from "./outstanding-card";
import { PaymentList } from "./payment-list";
import { RepaySheet } from "./repay-sheet";
import { ScheduleTable } from "./schedule-table";

export function LoanDetail({ id }: { id: string }) {
  const T = COPY.loans;
  const loan = useStore((s) => s.loans.find((l) => l.id === id) ?? null);
  const extra = useStore((s) => s.payments.extra);
  const [repay, setRepay] = useState(false);

  if (!loan)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Loan" />
        <GlassCard radius="lg">
          <EmptyState title="We can't find that loan" body="It may not be set up on this account." action={<GlassButton asChild><Link href="/dashboard/loans">{T.title}</Link></GlassButton>} />
        </GlassCard>
      </div>
    );

  const next = nextInstalment(loan);
  const payments = [...extra, ...PAYMENTS].filter((p) => p.loanId === loan.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={loan.product} subtitle={`${loan.id} · ${loan.lender}`} />
      <div className="space-y-5">
        <GlassCard radius="xl" strength="strong" className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-ink-2">Borrowed</p>
            <p className="text-2xl font-semibold tracking-[-0.035em] tabular-nums">{formatINR(loan.principal)}</p>
            <p className="text-xs text-ink-2">
              {loan.tenure} monthly instalments · started {formatDate(loan.disbursedOn)}
            </p>
          </div>
          {next && <GlassButton size="lg" onClick={() => setRepay(true)}>{T.repay} {formatINR(next.amount)}</GlassButton>}
        </GlassCard>

        <OutstandingCard loan={loan} />

        <section aria-label={T.schedule}>
          <h2 className="mb-2 text-[16px] font-semibold tracking-[-0.015em]">{T.schedule}</h2>
          <ScheduleTable schedule={loan.schedule} />
        </section>

        <GlassCard radius="lg" className="p-5" role="region" aria-label={T.acceptance}>
          <h2 className="mb-2 text-[16px] font-semibold tracking-[-0.015em]">{T.acceptance}</h2>
          <dl className="divide-y divide-ink/10 text-sm">
            <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">Accepted on</dt><dd className="font-semibold">{formatDate(loan.acceptance.at)}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">Offer version</dt><dd className="font-mono font-semibold">{loan.acceptance.offerVersion}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">Terms version</dt><dd className="font-mono font-semibold">{loan.acceptance.termsVersion}</dd></div>
          </dl>
        </GlassCard>

        <GlassCard radius="lg" className="p-5" role="region" aria-label="Payments">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em]">Payments</h2>
            <GlassButton asChild variant="soft" size="sm">
              <Link href={`/dashboard/loans/${loan.id}/statement`}>
                <FileText className="size-4" aria-hidden /> {T.statement}
              </Link>
            </GlassButton>
          </div>
          {payments.length === 0 ? <EmptyState title="No payments yet" body="Repayments you make show up here." /> : <PaymentList payments={payments} onRetry={() => setRepay(true)} />}
          {next && <div className="hidden"><StatusPill kind="instalment" value={next.state} /></div>}
        </GlassCard>
      </div>
      <RepaySheet loan={loan} open={repay} onOpenChange={setRepay} />
    </div>
  );
}
