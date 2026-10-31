"use client";

import { GlassCard } from "@/components/glass";
import { Row } from "@/components/dashboard/sheets";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { outstandingOf } from "@/lib/store/store";
import type { Loan } from "@/lib/store/types";

/** Principal and each other amount on its own line (with a tooltip), total underneath as a sum. */
export function OutstandingCard({ loan }: { loan: Loan }) {
  const T = COPY.loans;
  const o = outstandingOf(loan);
  return (
    <GlassCard radius="lg" className="px-5" role="region" aria-label={T.outstandingTitle}>
      <h3 className="pt-4 text-sm font-bold">{T.outstandingTitle}</h3>
      <dl className="divide-y divide-ink/10">
        <Row label={T.principal.label} tip={T.principal.tip} value={formatINR(o.principal)} />
        <Row label={T.interest.label} tip={T.interest.tip} value={formatINR(o.interest)} />
        <Row label={T.fees.label} tip={T.fees.tip} value={formatINR(o.fees)} />
        <Row label={T.penalties.label} tip={T.penalties.tip} value={formatINR(o.penalties)} />
        <Row label={T.total} value={formatINR(o.total)} strong />
      </dl>
    </GlassCard>
  );
}
