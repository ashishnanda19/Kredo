"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, CircleMinus, CircleX, Info, Loader2, ShieldAlert } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { CREDIT_PROFILE } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { PageHeader } from "./header";

const PHASE2 = process.env.NEXT_PUBLIC_PHASE2_CREDIT_PROFILE !== "false";
const T = COPY.credit;


const schema = z.object({
  record: z.string().min(1, "Choose the record."),
  issue: z.string().trim().min(15, "Describe the issue (at least 15 characters).").max(600, "Keep it under 600 characters."),
});
type Values = z.infer<typeof schema>;

function Gauge({ value }: { value: number }) {
  return <ScoreGauge value={value} className="mx-auto w-full max-w-[260px]" />;
}

const EFFECT = { positive: { icon: CircleCheck, cls: "text-ok-text", word: "Helping" }, neutral: { icon: CircleMinus, cls: "text-ink-2", word: "Neutral" }, negative: { icon: CircleX, cls: "text-warn-text", word: "Holding back" } } as const;

export function CreditProfile() {
  const verified = useStore((s) => s.verification.status === "accepted");
  const hasRepayment = useStore((s) => s.loans.some((l) => l.schedule.some((i) => i.state === "paid")));
  const allRequests = useStore((s) => s.requests);
  const requests = useMemo(() => allRequests.filter((r) => r.type === "credit_correction"), [allRequests]);
  const addRequest = useStore((s) => s.addRequest);
  const [created, setCreated] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { record: "", issue: "" } });
  const { errors, isSubmitting } = form.formState;

  if (!PHASE2)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={T.title} />
        <GlassCard radius="lg"><EmptyState title="Coming soon" body="The credit profile is part of a later release." /></GlassCard>
      </div>
    );

  const available = verified && hasRepayment;

  async function submit(v: Values) {
    await new Promise((r) => setTimeout(r, 700));
    setCreated(addRequest("credit_correction", `${v.record}: ${v.issue}`).ref);
    form.reset();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warn-text" role="note">
        <span aria-hidden className="size-1.5 rounded-full bg-current" /> {T.ribbon}
      </div>
      <PageHeader title={T.title} />

      {/* permanent notice: the internal score is not a bureau score */}
      <p role="note" className="mb-4 flex items-start gap-2 rounded-2xl border border-ink/20 bg-ink/[0.07] px-4 py-3 text-sm font-semibold">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-info-text" aria-hidden /> {T.notice}
      </p>

      {!available ? (
        <GlassCard radius="lg">
          <EmptyState title={T.notAvailableTitle} body={T.notAvailableBody} action={<GlassButton asChild><Link href="/dashboard/loans">See my loans</Link></GlassButton>} />
        </GlassCard>
      ) : (
        <div className="space-y-5">
          <GlassCard radius="xl" strength="strong" className="p-5 sm:p-6" role="region" aria-label={T.gaugeLabel}>
            <h2 className="flex items-center gap-1.5 text-[16px] font-semibold tracking-[-0.015em]"><Info className="size-4 text-info-text" aria-hidden /> {T.gaugeLabel}</h2>
            <Gauge value={CREDIT_PROFILE.score} />
          </GlassCard>

          <GlassCard radius="lg" className="p-5" role="region" aria-label={T.factors}>
            <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em]">{T.factors}</h2>
            <ol className="space-y-2">
              {CREDIT_PROFILE.factors.map((f, i) => {
                const e = EFFECT[f.effect];
                return (
                  <li key={f.id} className="glass glass-soft flex items-start gap-3 rounded-2xl p-3">
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/10 text-xs font-semibold tracking-[-0.035em]">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{f.title} <span className={`inline-flex items-center gap-1 text-xs ${e.cls}`}><e.icon className="size-3.5" aria-hidden />{e.word}</span></p>
                      <p className="text-sm text-ink-2">{f.why}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </GlassCard>

          <GlassCard radius="lg" className="p-5" role="region" aria-label={T.history}>
            <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em]">{T.history}</h2>
            <ol className="space-y-3 border-l border-ink/20 pl-4">
              {CREDIT_PROFILE.history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span aria-hidden className={`absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ${h.ok ? "bg-ok" : "bg-warn"}`} />
                  <p className="font-semibold">{h.text}</p>
                  <p className="text-xs text-ink-2">{formatDate(h.date)}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm"><span className="font-semibold">{T.reporting}: </span>{CREDIT_PROFILE.reporting}</p>
          </GlassCard>

          <GlassCard radius="lg" className="p-5" role="region" aria-label={T.correctionTitle}>
            <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{T.correction}</h2>
            <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-3 space-y-4">
              <Field id="record" label="Which record?" error={errors.record?.message}>
                <GlassSelect id="record" invalid={!!errors.record} aria-describedby="record-err" disabled={isSubmitting} {...form.register("record")}>
                  <option value="">Choose</option>
                  {CREDIT_PROFILE.history.map((h) => <option key={h.id} value={h.text}>{formatDate(h.date)}: {h.text}</option>)}
                  <option value="Contributing factor">A contributing factor</option>
                </GlassSelect>
              </Field>
              <Field id="issue" label="What is inaccurate?" error={errors.issue?.message}>
                <GlassTextarea id="issue" invalid={!!errors.issue} aria-describedby="issue-err" disabled={isSubmitting} {...form.register("issue")} />
              </Field>
              <GlassButton type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Sending…</> : "Send correction request"}</GlassButton>
              {created && <div role="status" className="space-y-2 rounded-2xl bg-success-soft px-4 py-3 text-sm"><p>{T.sent(created)}</p><ReferenceNumber value={created} label="Request" /></div>}
            </form>
            {requests.length > 0 && (
              <ul className="mt-4 divide-y divide-ink/10">
                {requests.map((r) => (
                  <li key={r.ref} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-mono font-semibold">{r.ref}</span><StatusPill kind="request" value={r.status} /></li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
