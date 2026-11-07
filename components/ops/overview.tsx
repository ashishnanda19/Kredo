"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect } from "@/components/forms/select";
import { GlassButton, GlassCard } from "@/components/glass";
import { useFakeLoad } from "@/lib/hooks";
import { LOAN_EVENTS, OPS_LOANS, OPS_SERIES, OPS_TICKETS, QUEUE } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { Guarded, Kpi, OpsPage, Toast, useRole, useToast } from "./common";
import { downloadCsv, effectiveStatus } from "./ops-data";
import { Skeleton } from "@/components/ui/skeleton";

function Tip({ active, payload, label, unit }: { active?: boolean; payload?: readonly { value?: unknown }[]; label?: unknown; unit: string }) {
  return active && payload?.length ? (
    <div className="glass glass-strong rounded-xl px-3 py-1.5 text-xs">
      <span className="font-bold">{String(label)}</span> <span className="tabular-nums text-ink-2">{String(payload[0].value)} {unit}</span>
    </div>
  ) : null;
}

export function OpsOverview() {
  const { can } = useRole();
  const decisions = useStore((s) => s.ops.decisions);
  const audit = useStore((s) => s.audit);
  const ready = useFakeLoad(600);
  const [range, setRange] = useState("14");
  const toast = useToast();

  const k = useMemo(() => {
    const st = QUEUE.map((q) => effectiveStatus(q, decisions));
    const count = (s: string) => st.filter((x) => x === s).length;
    const loanCounts = OPS_LOANS.reduce<Record<string, number>>((a, l) => ({ ...a, [l.status]: (a[l.status] ?? 0) + 1 }), {});
    const overdueTickets = OPS_TICKETS.filter((t) => t.dueInHours < 0 && t.status !== "resolved").length;
    return {
      total: QUEUE.length,
      pending: count("pending"),
      accepted: count("accepted"),
      rejected: count("failed"),
      expired: count("expired"),
      escalated: count("escalated"),
      overdue: overdueTickets,
      failedIntegrations: LOAN_EVENTS.filter((e) => e.status !== "success").length,
      unresolved: OPS_TICKETS.filter((t) => t.status !== "resolved").length,
      loanCounts,
    };
  }, [decisions]);

  const series = OPS_SERIES.slice(-Number(range));

  function exportCsv() {
    downloadCsv(`ops-overview-${range}d.csv`, [["day", "applications", "review_turnaround_hours"], ...series.map((s) => [s.day, s.applications, s.turnaround])]);
    audit("Exported overview CSV", `Range: last ${range} days`);
    toast.show("CSV downloaded (mock)");
  }

  return (
    <OpsPage
      title="Operations overview"
      desc="Mock figures for the preview."
      actions={
        <>
          <div className="w-40">
            <Field id="range" label="Date range">
              <GlassSelect id="range" value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
              </GlassSelect>
            </Field>
          </div>
          <div className="self-end">
            <Guarded allowed={can("export")} why="Your role cannot export data.">
              <GlassButton size="sm" onClick={exportCsv} disabled={!can("export")}>
                <Download className="size-4" aria-hidden /> Export CSV
              </GlassButton>
            </Guarded>
          </div>
        </>
      }
    >
      {!ready ? (
        <div role="status" aria-label="Loading overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[20px]" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <section aria-label="Verification" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Total applications" value={k.total} />
            <Kpi label="Pending" value={k.pending} tone="warn" />
            <Kpi label="Accepted" value={k.accepted} tone="ok" />
            <Kpi label="Rejected" value={k.rejected} tone="danger" />
            <Kpi label="Expired" value={k.expired} />
            <Kpi label="Escalated" value={k.escalated} />
          </section>
          <section aria-label="Work" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Pending reviews" value={k.pending} hint="Awaiting a reviewer" />
            <Kpi label="Overdue operational tasks" value={k.overdue} tone={k.overdue ? "danger" : undefined} hint="Past their response deadline" />
            <Kpi label="Failed integration requests" value={k.failedIntegrations} tone={k.failedIntegrations ? "warn" : undefined} hint="Disbursement and repayment events" />
            <Kpi label="Unresolved support tickets" value={k.unresolved} />
          </section>
          <section aria-label="Loan applications by status">
            <h2 className="mb-2 text-sm font-bold">Loan application status</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(k.loanCounts).map(([s, n]) => (
                <span key={s} className="glass glass-soft rounded-full px-3 py-1.5 text-xs font-bold">
                  {s}: <span className="tabular-nums">{n}</span>
                </span>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard radius="lg" className="p-4" role="figure" aria-label="Applications over time">
              <h2 className="mb-2 text-sm font-bold">Applications over time</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="opsA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--ink)" stopOpacity={0.14} />
                        <stop offset="1" stopColor="var(--ink)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(150,140,190,0.15)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
                    <Tooltip content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} unit="applications" />} />
                    <Area type="monotone" dataKey="applications" stroke="var(--ink)" strokeWidth={2} fill="url(#opsA)" dot={{ r: 3, fill: "var(--ink)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            <GlassCard radius="lg" className="p-4" role="figure" aria-label="Review turnaround in hours">
              <h2 className="mb-2 text-sm font-bold">Review turnaround (hours)</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(150,140,190,0.15)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
                    <Tooltip content={(p) => <Tip active={p.active} payload={p.payload} label={p.label} unit="hours" />} />
                    <Line type="monotone" dataKey="turnaround" stroke="var(--info-fill)" strokeWidth={2} dot={{ r: 3, fill: "var(--info-fill)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
