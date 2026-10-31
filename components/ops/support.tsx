"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeOff, Lock, MessageSquare, NotebookPen } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { StatusPill } from "@/components/portal/status-chip";
import { OPS_TICKETS, TEAM, type OpsTicket } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { DataTable, Guarded, OpsPage, Toast, fmtDT, useRole, useToast, type Column } from "./common";

type Ov = ReturnType<typeof useStore.getState>["ops"]["tickets"][string];
const merge = (t: OpsTicket, o?: Ov) => ({ ...t, status: o?.status ?? t.status, assignee: o?.assignee === undefined ? t.assignee : o.assignee, priority: o?.priority ?? t.priority, messages: [...t.messages, ...(o?.messages ?? [])], internal: [...t.internal, ...(o?.internal ?? [])], history: o?.history ?? [] });

/** Countdown chip: overdue is highlighted. */
function Deadline({ hours, status }: { hours: number; status: string }) {
  if (status === "resolved") return <span className="text-xs text-muted">Resolved</span>;
  const over = hours < 0;
  const h = Math.abs(hours);
  const text = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", over ? "bg-danger-soft text-danger" : hours <= 4 ? "bg-warning-soft text-warning" : "bg-foreground/10")}>
      {over ? `Overdue ${text}` : `Due in ${text}`}
    </span>
  );
}

export function OpsSupportQueue() {
  const router = useRouter();
  const { can } = useRole();
  const over = useStore((s) => s.ops.tickets);
  const setT = useStore((s) => s.opsTicket);
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const edit = can("supportEdit");

  const rows = useMemo(
    () =>
      OPS_TICKETS.map((t) => merge(t, over[t.id]))
        .filter((t) => status === "all" || t.status === status)
        .filter((t) => assignee === "all" || (assignee === "none" ? !t.assignee : t.assignee === assignee))
        .filter((t) => priority === "all" || t.priority === priority),
    [over, status, assignee, priority],
  );

  const cols: Column<(typeof rows)[number]>[] = [
    { key: "r", header: "Reference", cell: (t) => <span className="font-mono font-bold">{t.ref}</span> },
    { key: "s", header: "Subject", cell: (t) => <span className="line-clamp-1 max-w-[220px]">{t.subject}</span> },
    { key: "p", header: "Priority", cell: (t) => <StatusPill kind="priority" value={t.priority} /> },
    {
      key: "a",
      header: "Assigned to",
      cell: (t) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Guarded allowed={edit} why="Only Support agents and Admins can assign tickets.">
            <GlassSelect aria-label={`Assign ${t.ref}`} className="!min-h-9 !rounded-xl !py-0 text-xs" disabled={!edit} value={t.assignee ?? ""} onChange={(e) => { setT(t.id, { assignee: e.target.value || null }); toast.show("Assignment saved and logged"); }}>
              <option value="">Unassigned</option>
              {TEAM.map((m) => <option key={m}>{m}</option>)}
            </GlassSelect>
          </Guarded>
        </span>
      ),
    },
    { key: "d", header: "Response deadline", cell: (t) => <Deadline hours={t.dueInHours} status={t.status} /> },
    { key: "st", header: "Status", cell: (t) => <StatusPill kind="ticket" value={t.status} /> },
    { key: "e", header: "Escalation", cell: (t) => (t.status === "escalated" ? <span className="font-bold text-danger">Escalated</span> : <span className="text-muted">None</span>) },
  ];

  const sel = "!min-h-10 !rounded-xl text-sm";
  return (
    <OpsPage title="Support and complaints" desc="Response deadlines count down. Overdue tickets are highlighted.">
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Field id="f-status" label="Status"><GlassSelect id="f-status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option>{["open", "in_progress", "awaiting", "resolved", "escalated"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</GlassSelect></Field>
        <Field id="f-as" label="Assignee"><GlassSelect id="f-as" className={sel} value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="all">All</option><option value="none">Unassigned</option>{TEAM.map((m) => <option key={m}>{m}</option>)}</GlassSelect></Field>
        <Field id="f-pr" label="Priority"><GlassSelect id="f-pr" className={sel} value={priority} onChange={(e) => setPriority(e.target.value)}><option value="all">All</option>{["low", "normal", "high", "urgent"].map((s) => <option key={s}>{s}</option>)}</GlassSelect></Field>
      </div>
      <DataTable caption="Support ticket queue" columns={cols} rows={rows} rowKey={(t) => t.id} onRow={(t) => router.push(`/ops/support/${t.id}`)} rowClass={(t) => (t.dueInHours < 0 && t.status !== "resolved" ? "bg-danger-soft/40" : "")} empty="No tickets match these filters." />
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}

export function OpsTicketDetail({ id }: { id: string }) {
  const { can } = useRole();
  const base = OPS_TICKETS.find((t) => t.id === id);
  const ov = useStore((s) => s.ops.tickets[id]);
  const setT = useStore((s) => s.opsTicket);
  const reply = useStore((s) => s.opsReply);
  const toast = useToast();
  const [cust, setCust] = useState("");
  const [intern, setIntern] = useState("");

  if (!base) return <GlassCard radius="lg" className="p-6 text-center">No such ticket. <Link href="/ops/support" className="font-bold text-neon-blue">Back</Link></GlassCard>;
  const t = merge(base, ov);
  const edit = can("supportEdit");
  const sens = can("seeSensitive");
  const why = "Only Support agents and Admins can change or reply to tickets.";

  const history = [
    { id: "h0", at: t.messages[0]?.at ?? "", by: "System", text: "Ticket created" },
    ...(base.assignee ? [{ id: "h1", at: t.messages[1]?.at ?? "", by: "System", text: `Assigned to ${base.assignee}` }] : []),
    ...t.history,
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/ops/support" className="text-sm font-bold text-neon-blue">← Queue</Link>
          <h1 className="text-2xl font-extrabold tracking-tight">{t.subject}</h1>
          <p className="text-sm text-muted"><span className="font-mono">{t.ref}</span> · {t.category} · {t.student}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><StatusPill kind="priority" value={t.priority} /><StatusPill kind="ticket" value={t.status} /><Deadline hours={t.dueInHours} status={t.status} /></div>
      </div>

      <GlassCard radius="lg" className="grid gap-3 p-4 sm:grid-cols-3" role="region" aria-label="Ticket controls">
        <Field id="d-status" label="Status"><Guarded allowed={edit} why={why}><GlassSelect id="d-status" disabled={!edit} value={t.status} onChange={(e) => { setT(id, { status: e.target.value as never }); toast.show("Status updated and logged"); }}>{["open", "in_progress", "awaiting", "resolved", "escalated"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</GlassSelect></Guarded></Field>
        <Field id="d-pri" label="Priority"><Guarded allowed={edit} why={why}><GlassSelect id="d-pri" disabled={!edit} value={t.priority} onChange={(e) => { setT(id, { priority: e.target.value as never }); toast.show("Priority updated and logged"); }}>{["low", "normal", "high", "urgent"].map((s) => <option key={s}>{s}</option>)}</GlassSelect></Guarded></Field>
        <Field id="d-as" label="Assignee"><Guarded allowed={edit} why={why}><GlassSelect id="d-as" disabled={!edit} value={t.assignee ?? ""} onChange={(e) => { setT(id, { assignee: e.target.value || null }); toast.show("Assignment saved and logged"); }}><option value="">Unassigned</option>{TEAM.map((m) => <option key={m}>{m}</option>)}</GlassSelect></Guarded></Field>
      </GlassCard>

      <GlassCard radius="lg" className="p-4" role="region" aria-label="Sensitive case details">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold"><EyeOff className="size-4" aria-hidden /> Sensitive case details</h2>
        {sens ? (
          <p className="text-sm">{t.sensitive}</p>
        ) : (
          <>
            <p aria-hidden className="select-none text-sm blur-sm">{t.sensitive}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Lock className="size-3.5" aria-hidden /> Hidden for your role. Only Support agents and Admins can see these details.</p>
          </>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* CUSTOMER-VISIBLE: solid blue edge, labelled */}
        <section aria-label="Customer conversation" className="rounded-[24px] border-2 border-neon-blue/60 bg-neon-blue/[0.07] p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-neon-blue"><MessageSquare className="size-4" aria-hidden /> Customer conversation <span className="rounded-full bg-neon-blue/20 px-2 py-0.5 text-[11px]">Visible to the student</span></h2>
          <ol className="mt-3 space-y-2">
            {t.messages.map((m) => (
              <li key={m.id} className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-sm", m.who === "student" ? "bg-foreground/10" : "ml-auto bg-neon-blue/25")}>
                <p className="text-[11px] font-bold text-muted">{m.who === "student" ? "Student" : "Agent"} · {fmtDT(m.at)}</p>
                {m.text}
              </li>
            ))}
          </ol>
          <div className="mt-3 space-y-2">
            <Field id="cust" label="Reply to the student (they will see this)"><Guarded allowed={edit} why={why}><GlassTextarea id="cust" disabled={!edit} value={cust} onChange={(e) => setCust(e.target.value)} className="min-h-20" /></Guarded></Field>
            <GlassButton size="sm" disabled={!edit || cust.trim().length < 3} onClick={() => { reply(id, "customer", cust.trim()); setCust(""); toast.show("Reply sent to the student (mock)"); }}>Send to student</GlassButton>
          </div>
        </section>

        {/* INTERNAL: dashed amber edge, striped, labelled */}
        <section aria-label="Internal notes" className="rounded-[24px] border-2 border-dashed border-warning/70 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--warning)_9%,transparent)_0_10px,transparent_10px_20px)] p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-warning"><NotebookPen className="size-4" aria-hidden /> Internal notes <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[11px]">Internal only. Never shown to the student</span></h2>
          <ol className="mt-3 space-y-2">
            {t.internal.length === 0 && <li className="text-sm text-muted">No internal notes yet.</li>}
            {t.internal.map((n) => (
              <li key={n.id} className="rounded-xl bg-warning/10 px-3 py-2 text-sm"><p className="text-[11px] font-bold text-muted">{n.by} · {fmtDT(n.at)}</p>{n.text}</li>
            ))}
          </ol>
          <div className="mt-3 space-y-2">
            <Field id="intern" label="Add an internal note (the student will NOT see this)"><Guarded allowed={edit} why={why}><GlassTextarea id="intern" disabled={!edit} value={intern} onChange={(e) => setIntern(e.target.value)} className="min-h-20" /></Guarded></Field>
            <GlassButton size="sm" variant="warning" disabled={!edit || intern.trim().length < 3} onClick={() => { reply(id, "internal", intern.trim()); setIntern(""); toast.show("Internal note saved"); }}>Save internal note</GlassButton>
          </div>
        </section>
      </div>

      <GlassCard radius="lg" className="p-4" role="region" aria-label="Auditable history">
        <h2 className="mb-3 text-sm font-bold">Auditable history</h2>
        <ol className="space-y-2 border-l border-foreground/20 pl-4">
          {history.map((h) => (
            <li key={h.id} className="relative text-sm"><span aria-hidden className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-neon-violet" />{h.text} <span className="text-xs text-muted">· {h.by}{h.at ? ` · ${fmtDT(h.at)}` : ""}</span></li>
          ))}
        </ol>
      </GlassCard>
      <Toast msg={toast.msg} />
    </div>
  );
}
