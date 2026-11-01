"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassButton, GlassCard, GlassInput } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { LogoLockup } from "@/components/shared/logo";
import { COPY } from "@/lib/copy";
import { addDays, formatDate, formatINR, MOCK_TODAY } from "@/lib/format";
import { PAYMENTS } from "@/lib/mock-data";
import { useHydrated, useStore } from "@/lib/store/store";
import { BRAND } from "@/lib/config";

const Demo = () => <p className="text-xs font-bold">Demo preview, no real money. This is not a real receipt or statement.</p>;

export function ReceiptView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const extra = useStore((s) => s.payments.extra);
  const p = [...extra, ...PAYMENTS].find((x) => x.id === id);
  if (!hydrated) return <p role="status" className="py-10 text-center text-ink-2">Loading…</p>;
  if (!p) return <GlassCard className="mx-auto max-w-md p-6 text-center">We can&rsquo;t find that receipt. <Link href="/dashboard/loans" className="font-bold text-info-text">Back to loans</Link></GlassCard>;
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/loans" className="text-sm font-bold text-info-text">← Back</Link>
        <GlassButton size="sm" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print</GlassButton>
      </div>
      <GlassCard radius="lg" className="space-y-4 p-6" role="article" aria-label={`Receipt ${p.id}`}>
        <div>
          <LogoLockup className="mb-4 h-8 text-ink" />
          <h1 className="text-2xl font-extrabold">{COPY.loans.receipt}</h1>
          <p className="text-xs text-ink-2">{BRAND.name} · for payments to the regulated lending partner</p>
        </div>
        <dl className="divide-y divide-ink/10 text-sm">
          {[
            ["Receipt number", p.id],
            ["Date", formatDate(p.date)],
            ["Amount", formatINR(p.amount)],
            ["Method", p.method],
            ["Reference (masked)", p.ref],
            ["Applied to", p.instalment ? `Loan ${p.loanId}, instalment ${p.instalment}` : p.note ?? "Payment"],
            ["Status", ""],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-ink-2">{k}</dt>
              <dd className="font-semibold">{k === "Status" ? <StatusPill kind="payment" value={p.state} /> : v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs">{p.reconciled ? COPY.loans.matched : COPY.loans.pendingRecon}</p>
        <Demo />
      </GlassCard>
    </div>
  );
}

export function StatementView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const loan = useStore((s) => s.loans.find((l) => l.id === id) ?? null);
  const extra = useStore((s) => s.payments.extra);
  const [from, setFrom] = useState(addDays(MOCK_TODAY, -90).toISOString().slice(0, 10));
  const [to, setTo] = useState(MOCK_TODAY.toISOString().slice(0, 10));

  if (!hydrated) return <p role="status" className="py-10 text-center text-ink-2">Loading…</p>;
  if (!loan) return <GlassCard className="mx-auto max-w-md p-6 text-center">We can&rsquo;t find that loan. <Link href="/dashboard/loans" className="font-bold text-info-text">Back to loans</Link></GlassCard>;

  const rows = [...extra, ...PAYMENTS].filter((p) => p.loanId === loan.id && p.date.slice(0, 10) >= from && p.date.slice(0, 10) <= to).sort((a, b) => a.date.localeCompare(b.date));
  const paid = rows.filter((r) => r.state === "successful").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 space-y-3 print:hidden">
        <Link href={`/dashboard/loans/${loan.id}`} className="text-sm font-bold text-info-text">← Back to loan</Link>
        <GlassCard radius="lg" className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="from" label="From"><GlassInput id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field id="to" label="To"><GlassInput id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
          <GlassButton onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Download (print)</GlassButton>
        </GlassCard>
        <p className="text-xs text-ink-2">{COPY.loans.printHint}</p>
      </div>
      <GlassCard radius="lg" className="space-y-4 p-6" role="article" aria-label="Loan statement">
        <div>
          <LogoLockup className="mb-4 h-8 text-ink" />
          <h1 className="text-2xl font-extrabold">{COPY.loans.statement}</h1>
          <p className="text-xs text-ink-2">
            {loan.product} · {loan.id} · {loan.lender}
          </p>
          <p className="text-xs text-ink-2">
            {formatDate(from)} to {formatDate(to)}
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-2">No payments in this period.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Payments in the selected period</caption>
            <thead className="text-xs uppercase tracking-wider text-ink-2">
              <tr><th scope="col" className="py-2">Date</th><th scope="col">Reference</th><th scope="col">Status</th><th scope="col" className="text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5">{formatDate(r.date)}</td>
                  <td className="font-mono text-xs">{r.ref}</td>
                  <td><StatusPill kind="payment" value={r.state} /></td>
                  <td className="text-right font-semibold tabular-nums">{formatINR(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="border-t border-ink/15 pt-3 text-sm">
          Total successfully paid in this period: <span className="font-bold">{formatINR(paid)}</span>
        </p>
        <Demo />
      </GlassCard>
    </div>
  );
}
