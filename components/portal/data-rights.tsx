"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileSearch, Loader2 } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { PageHeader } from "@/components/dashboard/header";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { useFakeLoad } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { DATA_REQUEST_TYPES, VERSIONS } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { ConsentToggles } from "./consent-toggles";
import { ReferenceNumber } from "./mask";
import { RowsSkeleton } from "./list-skeleton";
import { StatusPill } from "./status-chip";

const schema = z.object({
  type: z.enum(["access", "correction", "deletion"]),
  detail: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(500, "Keep it under 500 characters."),
});
type Values = z.infer<typeof schema>;

export function DataRights() {
  const T = COPY.privacy;
  const requests = useStore((s) => s.requests);
  const addRequest = useStore((s) => s.addRequest);
  const ready = useFakeLoad(500);
  const [created, setCreated] = useState<string | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { type: "access", detail: "" } });
  const { errors, isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });

  async function submit(v: Values) {
    await new Promise((r) => setTimeout(r, 700));
    const r = addRequest(v.type, v.detail);
    setCreated(r.ref);
    form.reset({ type: v.type, detail: "" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={T.title} subtitle={T.sub} />
      <div className="space-y-4">
        <GlassCard radius="lg" className="p-5" role="region" aria-label={T.notices}>
          <h2 className="text-base font-bold">{T.notices}</h2>
          <ul className="mt-2 space-y-1 text-sm font-bold text-neon-blue">
            <li>
              <Link href="/legal/privacy">Privacy notice, version {VERSIONS.privacy}</Link>
            </li>
            <li>
              <Link href="/legal/terms">Terms, version {VERSIONS.terms}</Link>
            </li>
            <li>
              <Link href="/legal/key-facts">Key fact summary, version {VERSIONS.keyFacts}</Link>
            </li>
          </ul>
        </GlassCard>

        <GlassCard radius="lg" className="p-5" role="region" aria-label={T.consents}>
          <h2 className="text-base font-bold">{T.consents}</h2>
          <p className="text-sm text-muted">Change your mind any time. We will explain what changes before you confirm.</p>
          <ConsentToggles />
        </GlassCard>

        <GlassCard radius="lg" id="correction" className="p-5" role="region" aria-label="Make a request">
          <h2 className="text-base font-bold">Make a request</h2>
          <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-3 space-y-4">
            <Field id="type" label="What would you like to do?" error={errors.type?.message}>
              <GlassSelect id="type" disabled={isSubmitting} {...form.register("type")}>
                {DATA_REQUEST_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </GlassSelect>
            </Field>
            {type === "deletion" && <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm">{T.deletionNote}</p>}
            <Field id="detail" label="Details" error={errors.detail?.message}>
              <GlassTextarea id="detail" invalid={!!errors.detail} aria-describedby="detail-err" disabled={isSubmitting} {...form.register("detail")} />
            </Field>
            <GlassButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
                </>
              ) : (
                "Send request"
              )}
            </GlassButton>
            {created && (
              <div role="status" className="space-y-2 rounded-2xl bg-success-soft px-4 py-3 text-sm">
                <p>{T.requestSent(created)}</p>
                <ReferenceNumber value={created} label="Request" />
              </div>
            )}
          </form>
        </GlassCard>

        <GlassCard radius="lg" className="p-5" role="region" aria-label={T.requests}>
          <h2 className="mb-3 text-base font-bold">{T.requests}</h2>
          {!ready ? (
            <RowsSkeleton rows={2} label="Loading requests" />
          ) : requests.length === 0 ? (
            <EmptyState title="Nothing here yet" body={T.noRequests} />
          ) : (
            <ul className="divide-y divide-foreground/10">
              {requests.map((r) => (
                <li key={r.ref} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">
                      <FileSearch className="size-4 text-neon-violet" aria-hidden /> <span className="font-mono">{r.ref}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {r.type.replace("_", " ")} · {formatDate(r.at)}
                    </p>
                  </div>
                  <StatusPill kind="request" value={r.status} />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
