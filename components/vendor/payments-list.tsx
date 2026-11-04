"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard, GlassSegmented } from "@/components/glass";
import { VENDOR } from "@/lib/copy-demo";
import { loansOfVendor } from "@/lib/domain/selectors";
import { fmtDate, istDate } from "@/lib/domain/time";
import { useWorld } from "@/lib/store/world";
import { GlassButton as Btn } from "@/components/glass";
import { REFUND } from "@/lib/copy-demo";
import type { Loan } from "@/lib/domain/types";
import { PaymentRow } from "./payment-row";
import { RefundSheet } from "./refund-sheet";

type Filter = "all" | "received" | "settled" | "refunded";
const t = VENDOR.payments;
const PAGE = 15;

export function PaymentsList() {
  const world = useWorld((s) => s.world);
  const vendorId = useWorld((s) => s.session.vendorId);
  const [filter, setFilter] = useState<Filter>("all");
  const [refunding, setRefunding] = useState<Loan | null>(null);
  const [shown, setShown] = useState(PAGE);

  const loans = useMemo(() => {
    const all = vendorId ? loansOfVendor(world, vendorId) : [];
    return all.filter((l) => (filter === "all" ? true : filter === "refunded" ? l.status === "refunded" : l.status !== "refunded" && l.vendorStatus === filter)).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
  }, [world, vendorId, filter]);

  const days = useMemo(() => {
    const m = new Map<string, typeof loans>();
    for (const l of loans.slice(0, shown)) m.set(istDate(l.createdAt), [...(m.get(istDate(l.createdAt)) ?? []), l]);
    return [...m.entries()];
  }, [loans, shown]);

  if (!vendorId) return null;
  const total = loans.reduce((s, l) => s + l.coins - l.refundedCoins, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3"><h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1><Link href="/vendor/disputes" className="text-sm font-semibold underline">{REFUND.title}</Link></div>
      <GlassSegmented
        label="Filter payments"
        value={filter}
        onChange={(f) => { setFilter(f); setShown(PAGE); }}
        options={(Object.keys(t.filters) as Filter[]).map((k) => ({ value: k, label: t.filters[k] }))}
      />
      <p data-testid="payments-total" className="text-sm text-ink-2">{t.total(loans.length, total)}</p>
      {days.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-2">{filter === "all" ? t.empty : t.emptyFilter}</p>
      ) : (
        days.map(([day, rows]) => (
          <GlassCard key={day} radius="lg" className="px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2">{fmtDate(day)}</h2>
            <ul className="divide-y divide-hairline">
              {rows.map((l) => {
                const pending = world.refunds.some((r) => r.loanId === l.id && r.status === "pending_ops");
                const can = l.status !== "refunded" && l.repaid === 0 && !pending;
                return (
                  <li key={l.id}>
                    <PaymentRow world={world} loan={l} action={pending ? <span className="text-xs text-ink-2">{REFUND.requested}</span> : can ? <Btn size="sm" variant="ghost" className="min-h-9 px-3 text-xs" data-testid="refund-open" onClick={() => setRefunding(l)}>{REFUND.action}</Btn> : null} />
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        ))
      )}
      {loans.length > shown && (
        <Btn variant="secondary" className="w-full" data-testid="show-more" onClick={() => setShown((n) => n + PAGE)}>Show more ({loans.length - shown} left)</Btn>
      )}
      <RefundSheet loan={refunding} onClose={() => setRefunding(null)} />
    </div>
  );
}
