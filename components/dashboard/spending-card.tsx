"use client";

import dynamic from "next/dynamic";
import { PieChart as PieIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";

// Recharts is heavy: load it only on the client and only when the dashboard renders.
const SpendChart = dynamic(() => import("./spend-chart"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="mx-auto size-48 rounded-full" />
      <Skeleton className="h-24" />
    </div>
  ),
});

export function SpendingCard({ empty }: { empty?: boolean }) {
  return (
    <section aria-labelledby="spend-h" className="glass rounded-[24px] h-full  p-5">
      <h2 id="spend-h" className="mb-4 flex items-center gap-2 text-base font-bold">
        <PieIcon className="size-4 text-neon-violet" aria-hidden /> {COPY.dashboard.spend.title}
      </h2>
      {empty ? <EmptyState title={COPY.dashboard.spend.emptyTitle} body={COPY.dashboard.spend.emptyBody} /> : <SpendChart />}
    </section>
  );
}
