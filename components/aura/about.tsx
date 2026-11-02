"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { GrievanceCard } from "@/components/support/grievance-card";
import { COPY } from "@/lib/copy";
import { AURA } from "@/lib/copy-aura";
import { useStore } from "@/lib/store/store";

const RECORDS = ["A repayment shown on my Aura history", "A reason shown on my Aura", "My limit level", "Something else"];

const schema = z.object({
  record: z.string().min(1, "Choose the record."),
  issue: z.string().trim().min(15, "Describe the issue (at least 15 characters).").max(600, "Keep it under 600 characters."),
});
type Values = z.infer<typeof schema>;

/** FR-06 correction request, carried over from the credit profile: same store action and reference numbers. */
function CorrectionRequest() {
  const all = useStore((s) => s.requests);
  const requests = useMemo(() => all.filter((r) => r.type === "credit_correction"), [all]);
  const addRequest = useStore((s) => s.addRequest);
  const [created, setCreated] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { record: "", issue: "" } });
  const { errors, isSubmitting } = form.formState;

  async function submit(v: Values) {
    await new Promise((r) => setTimeout(r, 700));
    setCreated(addRequest("credit_correction", `${v.record}: ${v.issue}`).ref);
    form.reset();
  }

  return (
    <GlassCard radius="lg" role="region" id="dispute" aria-label={AURA.about.disputeTitle} className="scroll-mt-6 p-5">
      <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{AURA.about.disputeTitle}</h2>
      <p className="mt-1 text-sm text-ink-2">{AURA.about.disputeBody}</p>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-3 space-y-4">
        <Field id="record" label="Which record?" error={errors.record?.message}>
          <GlassSelect id="record" invalid={!!errors.record} aria-describedby="record-err" disabled={isSubmitting} {...form.register("record")}>
            <option value="">Choose</option>
            {RECORDS.map((r) => <option key={r} value={r}>{r}</option>)}
          </GlassSelect>
        </Field>
        <Field id="issue" label="What is inaccurate?" error={errors.issue?.message}>
          <GlassTextarea id="issue" invalid={!!errors.issue} aria-describedby="issue-err" disabled={isSubmitting} {...form.register("issue")} />
        </Field>
        <GlassButton type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Sending…</> : "Send correction request"}</GlassButton>
        {created && <div role="status" className="space-y-2 rounded-2xl bg-success-soft px-4 py-3 text-sm"><p>{COPY.credit.sent(created)}</p><ReferenceNumber value={created} label="Request" /></div>}
      </form>
      {requests.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10">
          {requests.map((r) => (
            <li key={r.ref} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-mono font-semibold">{r.ref}</span><StatusPill kind="request" value={r.status} /></li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export function AboutAura() {
  return (
    <div className="space-y-5" data-testid="aura-about">
      <GlassCard radius="lg" className="divide-y divide-ink/10 p-5">
        {AURA.about.sections.map((s) => (
          <section key={s.id} id={s.id} className="py-4 first:pt-0 last:pb-0">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.body}</p>
          </section>
        ))}
      </GlassCard>
      <CorrectionRequest />
      <GrievanceCard />
    </div>
  );
}
