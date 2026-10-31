"use client";

import Link from "next/link";
import { useState } from "react";
import { Banknote, FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/header";
import { GlassButton, GlassCard } from "@/components/glass";
import { RowsSkeleton } from "@/components/portal/list-skeleton";
import { StatusPill } from "@/components/portal/status-chip";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { useFakeLoad } from "@/lib/hooks";
import { formatDate, formatINR } from "@/lib/format";
import { PAYMENTS } from "@/lib/mock-data";
import { nextInstalment, outstandingOf, useStore } from "@/lib/store/store";
import type { Loan } from "@/lib/store/types";
import { OutstandingCard } from "./outstanding-card";
import { PaymentList } from "./payment-list";
import { RepaySheet } from "./repay-sheet";

export function LoansOverview() {
  const T = COPY.loans;
  const loans = useStore((s) => s.loans);
  const extra = useStore((s) => s.payments.extra);
  const disputes = useStore((s) => s.disputes);
  const ready = useFakeLoad(600);
  const [repay, setRepay] = useState<Loan | null>(null);

  const payments = [...extra, ...PAYMENTS].filter((p) => p.loanId !== "campus" || extra.includes(p));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={T.title} action={<GlassButton asChild size="sm"><Link href="/dashboard/loan/apply"><FilePlus2 className="size-4" aria-hidden /> Apply</Link></GlassButton>} />
      <div className="space-y-5">
        {!ready ? (
          <RowsSkeleton rows={3} label="Loading your loans" />
        ) : loans.length === 0 ? (
          <GlassCard radius="lg">
            <EmptyState title={T.emptyTitle} body={T.emptyBody} action={<GlassButton asChild><Link href="/dashboard/loan/apply">{T.emptyCta}</Link></GlassButton>} />
          </GlassCard>
        ) : (
          loans.map((loan) => {
            const next = nextInstalment(loan);
            const o = outstandingOf(loan);
            return (
              <section key={loan.id} aria-label={`${loan.product} ${loan.id}`} className="space-y-3">
                <GlassCard radius="xl" strength="strong" glow="violet" className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold">
                        <Link href={`/dashboard/loans/${loan.id}`} className="hover:underline">
                          {loan.product}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted">
                        {loan.id} · {loan.lender}
                      </p>
                    </div>
                    {next && <StatusPill kind="instalment" value={next.state} />}
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tabular-nums">{formatINR(o.total)}</p>
                  <p className="text-xs text-muted">{T.total}</p>
                  {next && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/15 pt-4">
                      <p className="text-sm">
                        {T.nextDue}: <span className="font-bold">{formatINR(next.amount)}</span> by <span className="font-bold">{formatDate(next.dueDate)}</span>
                      </p>
                      <GlassButton onClick={() => setRepay(loan)}>{T.repay}</GlassButton>
                    </div>
                  )}
                </GlassCard>
                <OutstandingCard loan={loan} />
              </section>
            );
          })
        )}

        <GlassCard radius="lg" className="p-5" role="region" aria-label="Payments">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
            <Banknote className="size-4 text-neon-violet" aria-hidden /> Payments
          </h2>
          {!ready ? <RowsSkeleton rows={3} label="Loading payments" /> : payments.length === 0 ? <EmptyState title="No payments yet" body="Repayments you make show up here." /> : <PaymentList payments={payments} onRetry={(id) => setRepay(loans.find((l) => l.id === id) ?? loans[0] ?? null)} />}
        </GlassCard>

        {disputes.length > 0 && (
          <GlassCard radius="lg" className="p-5" role="region" aria-label="Disputes">
            <h2 className="mb-2 text-base font-bold">Your disputes</h2>
            <ul className="divide-y divide-foreground/10">
              {disputes.map((d) => (
                <li key={d.ref} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-mono font-bold">{d.ref}</p>
                    <p className="truncate text-xs text-muted">
                      {d.category} · payment {d.paymentId} · {formatDate(d.at)}
                    </p>
                  </div>
                  <StatusPill kind="dispute" value={d.status} />
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>
      <RepaySheet loan={repay} open={!!repay} onOpenChange={(o) => !o && setRepay(null)} />
    </div>
  );
}
