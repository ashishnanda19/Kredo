"use client";

import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { Progress } from "@/components/ui/progress";
import { InfoTip } from "@/components/shared/info-tip";
import { daysUntil, formatDate, formatINR } from "@/lib/format";
import type { Loan } from "@/lib/mock-data";
import { COPY } from "@/lib/copy";

export function LoansSection({ loans }: { loans: Loan[] }) {
  return (
    <section aria-labelledby="loans-h">
      <h2 id="loans-h" className="mb-3 flex items-center gap-1.5 text-base font-bold">
        {COPY.dashboard.loans.title}
        <InfoTip text="Your spends are grouped into loans. Each one has its own due date." label="What are active loans?" />
      </h2>
      {loans.length === 0 ? (
        <div className="glass rounded-[24px] ">
          <EmptyState title="No active loans" body="You don't owe anything right now. Nice." />
        </div>
      ) : (
        <Stagger className="grid gap-3 md:grid-cols-2" role="list">
          {loans.map((l) => {
            const remaining = l.total - l.repaid;
            const pct = (l.repaid / l.total) * 100;
            const left = daysUntil(l.dueDate);
            return (
              <StaggerItem key={l.id} role="listitem">
                <article className="glass rounded-[24px]  p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{l.title}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                        <CalendarClock className="size-4" aria-hidden /> Due {formatDate(l.dueDate)} · {left} days
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="block text-xs text-muted">Remaining</span>
                      <span className="text-lg font-extrabold tabular-nums">{formatINR(remaining)}</span>
                    </p>
                  </div>
                  <Progress value={pct} label={`${l.title}: ${Math.round(pct)} percent repaid`} className="mt-4" />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>Repaid {formatINR(l.repaid)}</span>
                    <span>Total {formatINR(l.total)}</span>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}
