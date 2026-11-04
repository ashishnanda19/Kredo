"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass";
import { INSIGHTS } from "@/lib/copy-demo";
import { stallInsights } from "@/lib/demo/insights";
import { fmtDate } from "@/lib/domain/time";
import { useWorld } from "@/lib/store/world";

function Bars({ data, label, testId }: { data: { label: string; value: number }[]; label: string; testId: string }) {
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div data-testid={testId}>
      {table ? (
        <table className="w-full text-left text-sm"><caption className="sr-only">{label}</caption><thead className="text-xs text-ink-2"><tr><th scope="col" className="py-1">Group</th><th scope="col" className="py-1 text-right">Value</th></tr></thead><tbody className="divide-y divide-hairline">{data.map((d) => <tr key={d.label}><th scope="row" className="py-1 font-normal">{d.label}</th><td className="py-1 text-right tabular-nums">{d.value}</td></tr>)}</tbody></table>
      ) : (
        <div role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`} className="space-y-1">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-ink-2">{d.label}</span>
              <span className="block h-3 flex-1 overflow-hidden rounded-full bg-ink/10"><span className="block h-full rounded-full bg-ink" style={{ width: `${(d.value / max) * 100}%` }} /></span>
              <span className="w-12 shrink-0 text-right font-semibold tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setTable(!table)} className="mt-2 min-h-9 text-xs font-semibold underline">{table ? INSIGHTS.chart : INSIGHTS.table}</button>
    </div>
  );
}

export function InsightsPage() {
  const world = useWorld((s) => s.world);
  const vendorId = useWorld((s) => s.session.vendorId);
  if (!vendorId) return null;
  const i = stallInsights(world, vendorId);
  const busy = i.hours.filter((h) => h.hour >= 6);
  const none = i.week.every((d) => d.count === 0) && i.customers30 === 0;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{INSIGHTS.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{INSIGHTS.sub}</p>
      </div>
      {none ? <GlassCard radius="xl" className="p-8 text-center text-sm text-ink-2" data-testid="insights-empty">{INSIGHTS.empty}</GlassCard> : (
        <>
          <GlassCard radius="xl" className="theme-light !border-0 !bg-accent p-5 text-[#0b0b0c] !shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0b0b0c]/65">{INSIGHTS.today}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-[-0.04em]" data-testid="ins-today">{i.today.coins} coins</p>
            <p className="text-sm text-[#0b0b0c]/70">{i.today.count} {i.today.count === 1 ? "payment" : "payments"} · {INSIGHTS.vsYesterday(i.today.coins - i.yesterday.coins)}</p>
          </GlassCard>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard radius="lg" className="p-4"><p className="text-xs text-ink-2">{INSIGHTS.ticket}</p><p className="text-xl font-semibold tabular-nums" data-testid="ins-ticket">{i.avgTicket} coins</p></GlassCard>
            <GlassCard radius="lg" className="p-4"><p className="text-xs text-ink-2">{INSIGHTS.customers}</p><p className="text-xl font-semibold tabular-nums" data-testid="ins-customers">{i.customers30}</p><p className="text-xs text-ink-2">{INSIGHTS.repeat(i.repeatPercent)}</p></GlassCard>
            <GlassCard radius="lg" className="col-span-2 p-4"><p className="text-xs text-ink-2">{INSIGHTS.refunds}</p><p className="text-sm font-semibold">{INSIGHTS.refundLine(i.refunds30.count, i.refunds30.coins)}</p></GlassCard>
          </div>
          <GlassCard radius="lg" className="space-y-2 p-5"><h2 className="text-base font-bold">{INSIGHTS.week}</h2><Bars testId="ins-week" label={INSIGHTS.week} data={i.week.map((d) => ({ label: fmtDate(d.date), value: d.coins }))} /></GlassCard>
          <GlassCard radius="lg" className="space-y-2 p-5"><h2 className="text-base font-bold">{INSIGHTS.hours}</h2><p className="text-xs text-ink-2">{INSIGHTS.hoursSub}</p><Bars testId="ins-hours" label={INSIGHTS.hours} data={busy.map((h) => ({ label: `${String(h.hour).padStart(2, "0")}:00`, value: h.count }))} /></GlassCard>
        </>
      )}
    </div>
  );
}
