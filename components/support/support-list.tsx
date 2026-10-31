"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/header";
import { GlassButton, GlassCard } from "@/components/glass";
import { RowsSkeleton } from "@/components/portal/list-skeleton";
import { StatusPill } from "@/components/portal/status-chip";
import { EmptyState } from "@/components/shared/states";
import { COPY } from "@/lib/copy";
import { useFakeLoad } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { RESPONSE_EXPECTATION } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { GrievanceCard } from "./grievance-card";
import { TicketSheet } from "./ticket-form";

export function SupportList() {
  const T = COPY.support;
  const router = useRouter();
  const tickets = useStore((s) => s.tickets);
  const ready = useFakeLoad(600);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={T.title} action={<GlassButton size="sm" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden /> {T.newTicket}</GlassButton>} />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <GlassCard radius="lg" className="p-5" role="region" aria-label="Your tickets">
          {!ready ? (
            <RowsSkeleton rows={4} label="Loading tickets" />
          ) : tickets.length === 0 ? (
            <EmptyState title={T.empty} body="Raise a ticket any time something looks off." action={<GlassButton onClick={() => setOpen(true)}>{T.newTicket}</GlassButton>} />
          ) : (
            <ul className="divide-y divide-foreground/10">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/dashboard/support/${t.id}`} className="flex min-h-16 items-center gap-3 py-3">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.07] text-neon-violet"><LifeBuoy className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{t.subject}</span>
                      <span className="block truncate text-xs text-muted">
                        <span className="font-mono">{t.ref}</span> · {t.category} · updated {formatDate(t.updatedAt)}
                      </span>
                    </span>
                    <StatusPill kind="ticket" value={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">{RESPONSE_EXPECTATION}</p>
        </GlassCard>
        <GrievanceCard />
      </div>
      <TicketSheet open={open} onOpenChange={setOpen} onCreated={(id) => router.push(`/dashboard/support/${id}`)} />
    </div>
  );
}
