import { Mail, Phone, Scale } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { GRIEVANCE_CARD } from "@/lib/mock-data";

/** Fixed grievance and lender contact card. All details are clearly marked placeholders. */
export function GrievanceCard() {
  const g = GRIEVANCE_CARD;
  const T = COPY.support;
  return (
    <GlassCard radius="lg" role="region" aria-label={T.grievance} className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{T.grievance}</h2>
        <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-bold text-warning">Placeholder</span>
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="text-muted">Lender</dt><dd className="font-semibold">{g.lender}</dd></div>
        <div><dt className="text-muted">Grievance officer</dt><dd className="font-semibold">{g.officer}</dd></div>
        <div className="flex items-center gap-2"><Mail className="size-4 text-neon-violet" aria-hidden /><a href={`mailto:${g.email}`} className="font-semibold text-neon-blue">{g.email}</a></div>
        <div className="flex items-center gap-2"><Phone className="size-4 text-neon-violet" aria-hidden /><span className="font-semibold">{g.phone}</span></div>
        <div className="flex items-start gap-2"><Scale className="mt-0.5 size-4 shrink-0 text-neon-violet" aria-hidden /><span><span className="font-semibold">Escalation path.</span> {g.escalation}</span></div>
      </dl>
      <p className="text-xs text-muted">{T.escalationNote}</p>
      <p className="text-xs text-muted">{T.placeholderNote}</p>
    </GlassCard>
  );
}
