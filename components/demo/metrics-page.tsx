"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton, GlassCard } from "@/components/glass";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { METRICS, TIER_LABEL } from "@/lib/copy-demo";
import { computeMetrics, defaultAssumptions, unitEconomics, type Assumptions, type Bar } from "@/lib/demo/metrics";
import { fmtDate } from "@/lib/domain/time";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DemoMoneyLabel } from "./demo-money-label";

/** Every card carries the "Simulated" badge, so no figure can be taken for real traction. */
function SimCard({ title, sub, children, testId }: { title: string; sub?: string; children: React.ReactNode; testId?: string }) {
  return (
    <GlassCard radius="lg" className="space-y-3 p-5" data-testid={testId}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {sub && <p className="text-xs text-ink-2">{sub}</p>}
        </div>
        <span data-testid="sim-badge" className="shrink-0 rounded-full border border-warn/45 bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warn-text">{METRICS.badge}</span>
      </div>
      {children}
    </GlassCard>
  );
}

/** A bar chart with a table view, so the numbers are readable without the picture. */
function Bars({ data, label, unit = "", testId }: { data: Bar[]; label: string; unit?: string; testId: string }) {
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="py-4 text-sm text-ink-2">{METRICS.empty}</p>;
  return (
    <div data-testid={testId}>
      {table ? (
        <table className="w-full text-left text-sm"><caption className="sr-only">{label}</caption><thead className="text-xs text-ink-2"><tr><th scope="col" className="py-1">Group</th><th scope="col" className="py-1 text-right">Count</th></tr></thead><tbody className="divide-y divide-hairline">{data.map((d) => <tr key={d.label}><th scope="row" className="py-1 font-normal">{d.label}</th><td className="py-1 text-right tabular-nums">{d.value}{unit}</td></tr>)}</tbody></table>
      ) : (
        <div role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`} className="space-y-1">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 truncate text-ink-2 sm:w-36">{d.label}</span>
              <span className="block h-3 flex-1 overflow-hidden rounded-full bg-ink/10"><span className="block h-full rounded-full bg-ink" style={{ width: `${(d.value / max) * 100}%` }} /></span>
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{d.value}{unit}</span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setTable(!table)} className="mt-2 min-h-9 text-xs font-semibold underline">{table ? METRICS.chart : METRICS.table}</button>
    </div>
  );
}

function Kpi({ label, value, sub, testId }: { label: string; value: string | number; sub?: string; testId: string }) {
  return (
    <GlassCard radius="lg" className="p-4">
      <p className="text-xs font-semibold text-ink-2">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums" data-testid={testId}>{value}</p>
      {sub && <p className="text-xs text-ink-2">{sub}</p>}
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-warn-text">{METRICS.badge}</p>
    </GlassCard>
  );
}

function Econ({ ticket, term }: { ticket: number; term: number }) {
  const [a, setA] = useState<Assumptions>(defaultAssumptions());
  const u = unitEconomics(a, ticket, term);
  const f = METRICS.econ.fields;
  const set = (k: keyof Assumptions, v: string) => setA({ ...a, [k]: Number(v) >= 0 && v !== "" ? Number(v) : 0 });
  const money = (n: number) => `₹${(Math.round(n * 100) / 100).toFixed(2)}`;
  return (
    <SimCard title={METRICS.econ.title} sub={METRICS.econ.sub} testId="econ">
      <p className="rounded-xl bg-warning-soft px-3 py-1.5 text-xs font-bold text-warn-text">{METRICS.econ.illustrative}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(f) as (keyof Assumptions)[]).map((k) => (
          <label key={k} className="text-xs font-semibold">{f[k]}
            <input data-testid={`as-${k}`} inputMode="decimal" value={a[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 min-h-11 w-full rounded-[14px] border border-hairline bg-card px-3 text-base tabular-nums" />
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-2">{METRICS.econ.ticket(ticket, term)}</p>
      <dl className="divide-y divide-hairline text-sm">
        <div className="flex justify-between py-2"><dt>{METRICS.econ.rows.revenue}</dt><dd className="tabular-nums" data-testid="u-revenue">{money(u.revenue)}</dd></div>
        <div className="flex justify-between py-2 text-ink-2"><dt>{METRICS.econ.rows.costOfFunds}</dt><dd className="tabular-nums">-{money(u.costOfFunds)}</dd></div>
        <div className="flex justify-between py-2 text-ink-2"><dt>{METRICS.econ.rows.defaultLoss}</dt><dd className="tabular-nums">-{money(u.defaultLoss)}</dd></div>
        <div className="flex justify-between py-2 text-ink-2"><dt>{METRICS.econ.rows.cac}</dt><dd className="tabular-nums">-{money(u.cacPerLoan)}</dd></div>
        <div className="flex justify-between py-2 font-bold"><dt>{METRICS.econ.rows.margin}</dt><dd className="tabular-nums" data-testid="u-margin">{money(u.margin)}</dd></div>
      </dl>
      <p className="text-xs text-ink-2">{METRICS.econ.split}</p>
      <GlassButton size="sm" variant="outline" onClick={() => setA(defaultAssumptions())}>{METRICS.econ.reset}</GlassButton>
    </SimCard>
  );
}

/** A clean, read-only dashboard computed from the demo world. Labelled "Simulated" everywhere. */
export function MetricsPage() {
  const hydrated = useWorldHydrated();
  const world = useWorld((s) => s.world);
  if (!DEMO_ENABLED) return <main id="main" className="p-8 text-center text-ink-2">{METRICS.off}</main>;
  if (!hydrated) return <main id="main" className="p-8" role="status" aria-label="Loading" />;
  const m = computeMetrics(world);
  const r = m.repayment;
  return (
    <main id="main" className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{METRICS.title}</h1>
        <div className="flex items-center gap-3"><DemoMoneyLabel /><Link href="/demo" className="text-sm font-semibold underline">Demo Stage</Link></div>
      </header>
      <p role="note" data-testid="sim-banner" className="rounded-2xl border border-warn/45 bg-warning-soft p-4 text-sm font-semibold text-warn-text">{METRICS.banner}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={METRICS.kpis.gmv} value={m.gmvCoins} sub={METRICS.kpiSub.gmv} testId="k-gmv" />
        <Kpi label={METRICS.kpis.loans} value={m.loans} testId="k-loans" />
        <Kpi label={METRICS.kpis.students} value={m.activeStudents} sub={METRICS.kpiSub.students(m.students)} testId="k-students" />
        <Kpi label={METRICS.kpis.vendors} value={m.activeVendors} sub={METRICS.kpiSub.vendors(m.vendors)} testId="k-vendors" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimCard title={METRICS.repay.title} sub={METRICS.repay.resolved(r.resolved)} testId="repayment">
          <div role="img" aria-label={`${r.onTimePct}% on time, ${r.latePct}% late, ${r.defaultPct}% defaulted`} className="flex h-4 overflow-hidden rounded-full bg-ink/10">
            <span className="bg-ok" style={{ width: `${r.onTimePct}%` }} /><span className="bg-warn" style={{ width: `${r.latePct}%` }} /><span className="bg-bad" style={{ width: `${r.defaultPct}%` }} />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-ink-2">{METRICS.repay.onTime}</dt><dd className="text-xl font-bold tabular-nums" data-testid="r-ontime">{r.onTimePct}%</dd></div>
            <div><dt className="text-ink-2">{METRICS.repay.late}</dt><dd className="text-xl font-bold tabular-nums" data-testid="r-late">{r.latePct}%</dd></div>
            <div><dt className="text-ink-2">{METRICS.repay.defaulted}</dt><dd className="text-xl font-bold tabular-nums" data-testid="r-default">{r.defaultPct}%</dd></div>
            <div><dt className="text-ink-2">{METRICS.repay.avg}</dt><dd className="text-xl font-bold tabular-nums" data-testid="r-avgdays">{r.avgDaysToRepay}</dd></div>
            <div className="col-span-2"><dt className="text-ink-2">{METRICS.repay.delinquent}</dt><dd className="text-xl font-bold tabular-nums" data-testid="r-delinquent">{r.delinquent30Pct}% <span className="text-xs font-normal text-ink-2">{METRICS.repay.of}</span></dd></div>
          </dl>
        </SimCard>

        <SimCard title={METRICS.settle.title} sub={METRICS.settle.counts(m.settlement.paid, m.settlement.failed, m.settlement.onHold)} testId="settlement">
          <p className="text-xs text-ink-2">{METRICS.settle.volume}</p>
          <p className="text-3xl font-extrabold tabular-nums" data-testid="s-volume">₹{m.settlement.volume}</p>
          <p className="text-xs text-ink-2">{METRICS.settle.success}</p>
          <p className="text-3xl font-extrabold tabular-nums" data-testid="s-success">{m.settlement.successRatePct}%</p>
        </SimCard>

        <SimCard title={METRICS.aura.title} sub={METRICS.aura.sub} testId="aura-dist">
          <Bars data={m.auraBuckets} label={METRICS.aura.title} testId="aura-bars" />
          <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-ink-2">{METRICS.aura.tiers}</h3>
          <Bars data={m.tiers.map((t) => ({ ...t, label: TIER_LABEL[t.label] ?? t.label }))} label={METRICS.aura.tiers} testId="tier-bars" />
          <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-ink-2">{METRICS.aura.ladder}</h3>
          <Bars data={m.ladder} label={METRICS.aura.ladder} testId="ladder-bars" />
        </SimCard>

        <div className="space-y-4">
          <SimCard title={METRICS.vendors.title} testId="leaderboard">
            {m.leaderboard.length === 0 ? <p className="text-sm text-ink-2">{METRICS.empty}</p> : (
              <ol className="divide-y divide-hairline text-sm">{m.leaderboard.map((v, i) => <li key={v.stallName} className="flex items-center justify-between gap-3 py-2"><span>{i + 1}. {v.stallName}</span><span className="tabular-nums">{v.coins} coins · {METRICS.vendors.payments(v.payments)}</span></li>)}</ol>
            )}
          </SimCard>
          <SimCard title={METRICS.hours.title} sub={METRICS.hours.sub} testId="hours">
            <Bars data={m.hours.filter((h, i) => h.value > 0 || (i >= 7 && i <= 23))} label={METRICS.hours.title} testId="hour-bars" />
          </SimCard>
        </div>

        <SimCard title={METRICS.cohorts.title} sub={METRICS.cohorts.sub} testId="cohorts">
          {m.cohorts.length === 0 ? <p className="text-sm text-ink-2">{METRICS.empty}</p> : (
            <Bars data={m.cohorts.map((c) => ({ label: `Week of ${fmtDate(c.week)} (${METRICS.cohorts.due(c.due)})`, value: c.pct }))} label={METRICS.cohorts.title} unit="%" testId="cohort-bars" />
          )}
        </SimCard>
        <Econ ticket={m.avgTicket} term={m.avgTermDays} />
      </div>
      <p className="text-center text-xs text-ink-2">{METRICS.footer}</p>
    </main>
  );
}
