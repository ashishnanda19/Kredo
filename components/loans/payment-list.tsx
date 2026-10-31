"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, ClockAlert, FileText, Flag } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { PAY_STATE_INFO, type PaymentRecord } from "@/lib/mock-data";
import { DisputeSheet } from "./dispute-sheet";

/** Payments with state, reconciliation indicator, receipt link and a "Something looks wrong?" action. */
export function PaymentList({ payments, onRetry }: { payments: PaymentRecord[]; onRetry?: (loanId: string) => void }) {
  const [dispute, setDispute] = useState<string | null>(null);
  return (
    <>
      <ul className="divide-y divide-ink/10">
        {payments.map((p) => {
          const info = PAY_STATE_INFO[p.state];
          return (
            <li key={p.id} className="space-y-2 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold tabular-nums">{formatINR(p.amount)}</p>
                  <p className="truncate text-xs text-ink-2">
                    {formatDate(p.date)} · {p.method} · <span className="font-mono">{p.ref}</span>
                    {p.instalment ? ` · instalment ${p.instalment}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <StatusPill kind="payment" value={p.state} />
              </div>

              {p.state !== "successful" && (
                <p className="rounded-2xl bg-ink/[0.06] px-3 py-2 text-xs">
                  {info.why} <span className="font-semibold">{info.next}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {p.state === "successful" && p.reconciled ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-ok-text">
                    <CheckCheck className="size-3.5" aria-hidden /> {COPY.loans.matched}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-ink-2">
                    <ClockAlert className="size-3.5" aria-hidden /> {COPY.loans.pendingRecon}
                  </span>
                )}
                {p.state === "successful" && (
                  <Link href={`/dashboard/receipts/${p.id}`} className="inline-flex min-h-9 items-center gap-1 font-bold text-info-text">
                    <FileText className="size-3.5" aria-hidden /> {COPY.loans.receipt}
                  </Link>
                )}
                {p.state === "failed" && onRetry && p.loanId !== "campus" && (
                  <GlassButton size="sm" variant="soft" onClick={() => onRetry(p.loanId)}>
                    {COPY.loans.again}
                  </GlassButton>
                )}
                <button type="button" onClick={() => setDispute(p.id)} className="inline-flex min-h-9 items-center gap-1 font-bold text-info-text">
                  <Flag className="size-3.5" aria-hidden /> {COPY.loans.wrong}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <DisputeSheet paymentId={dispute} onOpenChange={(o) => !o && setDispute(null)} />
    </>
  );
}
