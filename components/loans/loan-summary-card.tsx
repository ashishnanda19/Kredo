"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { nextInstalment, outstandingOf, useStore } from "@/lib/store/store";
import { OutstandingCard } from "./outstanding-card";
import { RepaySheet } from "./repay-sheet";

/** Dashboard home: your instalment loan (principal vs other amounts), or a calm invitation to apply. */
export function LoanSummaryCard() {
  const T = COPY.loans;
  const loan = useStore((s) => s.loans[0] ?? null);
  const appStatus = useStore((s) => s.loanApp.status);
  const [repay, setRepay] = useState(false);

  if (!loan) {
    return (
      <GlassCard radius="lg" role="region" aria-label="Loans" className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-ink">
            <Landmark className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">Instalment loans</h2>
            <p className="text-sm text-ink-2">{appStatus === "none" || appStatus === "draft" ? "Offered by our regulated lending partner. Borrow only what you can repay." : "Your application is in progress."}</p>
            {appStatus !== "none" && appStatus !== "draft" && <StatusPill kind="loanApp" value={appStatus} className="mt-1" />}
          </div>
        </div>
        <GlassButton asChild variant="secondary">
          <Link href="/dashboard/loan/apply">{appStatus === "none" || appStatus === "draft" ? "See loan products" : "View application"}</Link>
        </GlassButton>
      </GlassCard>
    );
  }

  const next = nextInstalment(loan);
  const o = outstandingOf(loan);
  return (
    <section aria-label="Your loan" className="grid gap-4 md:grid-cols-2">
      <GlassCard radius="lg" strength="strong" className="flex flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{loan.product}</h2>
            <p className="text-xs text-ink-2">{loan.id}</p>
          </div>
          {next && <StatusPill kind="instalment" value={next.state} />}
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-[-0.035em] tabular-nums">{formatINR(o.total)}</p>
          <p className="text-xs text-ink-2">{T.total}</p>
        </div>
        {next && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-3">
            <p className="text-sm">
              {T.nextDue}: <span className="font-semibold">{formatINR(next.amount)}</span> by <span className="font-semibold">{formatDate(next.dueDate)}</span>
            </p>
            <GlassButton onClick={() => setRepay(true)}>{T.repay}</GlassButton>
          </div>
        )}
        <Link href="/dashboard/loans" className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          Schedule, payments and receipts <ArrowRight className="size-4" aria-hidden />
        </Link>
      </GlassCard>
      <OutstandingCard loan={loan} />
      <RepaySheet loan={loan} open={repay} onOpenChange={setRepay} />
    </section>
  );
}
