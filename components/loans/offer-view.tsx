"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { GlassButton, GlassCard, GlassFieldError } from "@/components/glass";
import { Row } from "@/components/dashboard/sheets";
import { COPY } from "@/lib/copy";
import { formatINR } from "@/lib/format";
import { VERSIONS, type Offer } from "@/lib/mock-portal";
import { ScheduleTable } from "./schedule-table";

/** Final offer screen: everything itemised before acceptance, nothing hidden. */
export function OfferView({ offer, onAccept, onDecline }: { offer: Offer; onAccept: () => void; onDecline: () => void }) {
  const T = COPY.loan;
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function accept() {
    if (!terms) {
      setErr(T.needTerms);
      return;
    }
    setBusy(true);
    setTimeout(onAccept, 900);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.035em]">{T.offerTitle}</h2>
        <p className="mt-1 text-sm text-ink-2">{T.offerSub}</p>
      </div>

      <GlassCard radius="lg" strength="strong" className="px-5">
        <dl className="divide-y divide-ink/10">
          <Row label={T.rows.lender} value={<span className="text-right">{offer.lender}</span>} />
          <Row label="Product" value={offer.productName} />
          <Row label={T.rows.amount} value={formatINR(offer.amount)} />
          <Row label={T.rows.interest} value={formatINR(offer.interest)} tip="The cost of borrowing for the whole period, as set by the lender." />
          <Row label={T.rows.processing} value={formatINR(offer.processing)} tip="A one-time fee charged by the lender for processing this coin spend." />
          <Row label={T.rows.other} value={formatINR(offer.other)} tip="Any other applicable charge. None apply to this offer." />
          <Row label={T.rows.total} value={formatINR(offer.total)} strong tip="Everything you will pay back: amount, interest and all fees." />
          <Row label={T.rows.instalments} value={`${offer.tenure} × ${formatINR(offer.perMonth)}`} />
        </dl>
      </GlassCard>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{T.scheduleTitle}</h3>
        <ScheduleTable schedule={offer.schedule} caption="Offer repayment schedule" />
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setErr(null); }} aria-describedby="terms-err" disabled={busy} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          <span>
            {T.termsCheck}{" "}
            <Link href="/legal/terms" target="_blank" className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              {T.terms} ({VERSIONS.terms})
            </Link>{" "}
            ·{" "}
            <Link href="/legal/key-facts" target="_blank" className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              {T.keyFacts}
            </Link>
          </span>
        </label>
        <GlassFieldError id="terms-err">{err}</GlassFieldError>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <GlassButton size="lg" className="flex-1" onClick={accept} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden /> {T.accepting}
            </>
          ) : (
            T.accept
          )}
        </GlassButton>
        <GlassButton variant="secondary" size="lg" onClick={onDecline} disabled={busy}>
          {T.decline}
        </GlassButton>
      </div>
      <p className="text-xs text-ink-2">{COPY.legal.nudge} {COPY.legal.disclosure}</p>
    </div>
  );
}
