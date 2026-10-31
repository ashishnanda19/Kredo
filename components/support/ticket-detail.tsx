"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Headset, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/header";
import { Field } from "@/components/forms/field";
import { GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { RESPONSE_EXPECTATION } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { GrievanceCard } from "./grievance-card";

const schema = z.object({ text: z.string().trim().min(5, "Write at least 5 characters.").max(800, "Keep it under 800 characters.") });

const ICON = { you: UserRound, support: Headset, system: Bot } as const;
const WHO = { you: "You", support: "Support", system: "System" } as const;

export function TicketDetail({ id }: { id: string }) {
  const T = COPY.support;
  const ticket = useStore((s) => s.tickets.find((t) => t.id === id) ?? null);
  const reply = useStore((s) => s.replyTicket);
  const form = useForm<{ text: string }>({ resolver: zodResolver(schema), defaultValues: { text: "" } });
  const { errors, isSubmitting } = form.formState;

  if (!ticket)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Ticket" />
        <GlassCard radius="lg">
          <EmptyState title="We can't find that ticket" body="It may belong to another account." action={<GlassButton asChild><Link href="/dashboard/support">{T.title}</Link></GlassButton>} />
        </GlassCard>
      </div>
    );

  async function send(v: { text: string }) {
    await new Promise((r) => setTimeout(r, 600));
    reply(id, v.text);
    form.reset();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={ticket.subject} subtitle={`${ticket.category} · opened ${formatDate(ticket.createdAt)}`} />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div className="space-y-5">
          <GlassCard radius="lg" className="flex flex-wrap items-center justify-between gap-3 p-4">
            <ReferenceNumber value={ticket.ref} label={T.refLabel} />
            <StatusPill kind="ticket" value={ticket.status} />
          </GlassCard>

          <GlassCard radius="lg" className="p-5" role="region" aria-label={T.timeline}>
            <h2 className="mb-3 text-base font-bold">{T.timeline}</h2>
            <ol className="space-y-4">
              {ticket.events
                .filter((e) => e.visible)
                .map((e) => {
                  const Icon = ICON[e.who];
                  return (
                    <li key={e.id} className="flex gap-3">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/[0.08] text-ink"><Icon className="size-4" /></span>
                      <div className="min-w-0">
                        <p className="text-xs text-ink-2"><span className="font-bold text-ink">{WHO[e.who]}</span> · {formatDate(e.at)}</p>
                        <p className={e.who === "system" ? "text-sm text-ink-2" : "text-sm"}>{e.text}</p>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </GlassCard>

          <GlassCard radius="lg" className="p-5">
            <form onSubmit={form.handleSubmit(send)} noValidate className="space-y-3">
              <Field id="reply" label={T.reply} error={errors.text?.message}>
                <GlassTextarea id="reply" invalid={!!errors.text} aria-describedby="reply-err" disabled={isSubmitting} {...form.register("text")} />
              </Field>
              <GlassButton type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : T.send}</GlassButton>
            </form>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard radius="lg" className="p-5" role="region" aria-label={T.expectation}>
            <h2 className="text-base font-bold">{T.expectation}</h2>
            <p className="mt-1 text-sm text-ink-2">{RESPONSE_EXPECTATION}</p>
          </GlassCard>
          <GrievanceCard />
        </div>
      </div>
    </div>
  );
}
