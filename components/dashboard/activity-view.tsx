"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { GlassButton, GlassCard, GlassSegmented } from "@/components/glass";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { useDemoState } from "@/lib/hooks";
import { CATEGORY_LABEL, transactions, type TxStatus } from "@/lib/mock-data";
import { DisputeSheet } from "@/components/loans/dispute-sheet";
import { PageHeader } from "./header";
import { ListSkeleton } from "./skeletons";
import { TransactionRow } from "./transaction-row";

type Filter = "all" | TxStatus;

export function ActivityView() {
  const t = COPY.activity;
  const { state, retry } = useDemoState(700);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [dispute, setDispute] = useState<string | null>(null);

  const source = useMemo(() => (state === "empty" ? [] : transactions), [state]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return source
      .filter((x) => filter === "all" || x.status === filter)
      .filter((x) => !needle || x.vendor.toLowerCase().includes(needle) || CATEGORY_LABEL[x.category].toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [source, filter, q]);

  const dueTotal = source.filter((x) => x.status === "due").reduce((s, x) => s + x.amount, 0);
  const filtered = q || filter !== "all";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.title} subtitle={state === "ready" ? t.stillToRepay(formatINR(dueTotal)) : undefined} />

      <div className="space-y-3">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-ink-2" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            aria-label="Search transactions"
            className="glass glass-soft min-h-12 w-full rounded-full pl-12 pr-12 text-base placeholder:text-ink-2/80 focus-visible:shadow-[0_0_0_2px_var(--ink)] focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-2 hover:text-ink">
              <X className="size-5" />
            </button>
          )}
        </div>

        <GlassSegmented label="Filter by status" options={t.filters} value={filter} onChange={setFilter} className="w-full sm:w-auto" />
      </div>

      <div className="mt-4" aria-live="polite">
        {state === "loading" && <ListSkeleton />}
        {state === "error" && (
          <GlassCard radius="lg">
            <ErrorState onRetry={retry} />
          </GlassCard>
        )}
        {(state === "ready" || state === "empty") &&
          (rows.length === 0 ? (
            <GlassCard radius="lg">
              <EmptyState
                title={filtered ? t.noMatchTitle : t.emptyTitle}
                body={filtered ? t.noMatchBody : t.emptyBody}
                action={
                  filtered && (
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQ("");
                        setFilter("all");
                      }}
                    >
                      {t.clear}
                    </GlassButton>
                  )
                }
              />
            </GlassCard>
          ) : (
            <Stagger key={`${filter}-${q}`} inView={false} className="glass divide-y divide-ink/10 rounded-[24px] px-5 py-2" role="list">
              {rows.map((x) => (
                <StaggerItem key={x.id} role="listitem">
                  <TransactionRow tx={x} onDispute={setDispute} />
                </StaggerItem>
              ))}
            </Stagger>
          ))}
      </div>
      <DisputeSheet paymentId={dispute} onOpenChange={(o) => !o && setDispute(null)} />
    </div>
  );
}
