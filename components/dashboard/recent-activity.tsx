"use client";

import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { GlassButton } from "@/components/glass";
import type { Transaction } from "@/lib/mock-data";
import { TransactionRow } from "./transaction-row";
import { COPY } from "@/lib/copy";

export function RecentActivity({ items }: { items: Transaction[] }) {
  return (
    <section aria-labelledby="recent-h" className="glass rounded-[24px] h-full  p-5">
      <div className="flex items-center justify-between">
        <h2 id="recent-h" className="text-base font-bold">
          Recent activity
        </h2>
        <Link href="/dashboard/activity" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-text">
          See all <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={COPY.dashboard.recent.emptyTitle}
          body={COPY.dashboard.recent.emptyBody}
          action={
            <GlassButton asChild size="sm">
              <Link href="/dashboard/pay">
                <ScanLine className="size-4" aria-hidden /> {COPY.dashboard.recent.emptyCta}
              </Link>
            </GlassButton>
          }
        />
      ) : (
        <Stagger inView={false} className="mt-1 divide-y divide-line" role="list">
          {items.map((tx) => (
            <StaggerItem key={tx.id} role="listitem">
              <TransactionRow tx={tx} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
