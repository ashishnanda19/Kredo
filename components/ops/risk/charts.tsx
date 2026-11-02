"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import { waterfallSteps, type Step } from "@/lib/ops-risk/waterfall";
import type { Snapshot } from "@/lib/ops-risk/types";

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="glass glass-strong rounded-xl px-3 py-1.5 text-xs">{children}</div>;
}

/** Students per 10-point Aura range: one series, one colour, 4px rounded tops, gaps between bars. */
export function AuraHistogram({ data }: { data: { from: number; to: number; count: number }[] }) {
  const reduce = useReducedMotion();
  const rows = data.map((d) => ({ ...d, label: `${d.from}–${d.to}` }));
  return (
    <div role="img" aria-label={`Aura histogram: ${rows.map((r) => `${r.label}: ${r.count}`).join(", ")}`} className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="from" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
          <Tooltip cursor={{ fill: "var(--hairline)" }} content={({ payload }) => {
            const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
            return p ? <Tip><span className="font-bold">Aura {p.label}</span> <span className="tabular-nums text-ink-2">{p.count} students</span></Tip> : null;
          }} />
          <Bar dataKey="count" fill="var(--cat-1)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const FILL = { total: "var(--ink)", up: "var(--pts-up)", down: "var(--pts-down)" } as const;

/** From the 500 base, through every factor's points and the velocity cap, to the final KRS. */
export function PointsWaterfall({ points, krs }: { points: Snapshot["points"]; krs: number }) {
  const reduce = useReducedMotion();
  const steps = waterfallSteps(points, krs);
  const max = Math.max(...steps.map((s) => s.offset + s.size), 600);
  return (
    <div role="img" aria-label={`Points from ${points.base} to KRS ${krs}: ${steps.slice(1, -1).map((s) => `${s.name} ${s.label}`).join(", ")}`} style={{ height: steps.length * 30 + 30 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={steps} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }} barCategoryGap={4}>
          <CartesianGrid horizontal={false} stroke="var(--hairline)" />
          <XAxis type="number" domain={[0, Math.ceil(max / 100) * 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fill: "var(--ink)", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "var(--hairline)" }} content={({ payload }) => {
            const p = payload?.[0]?.payload as Step | undefined;
            return p ? <Tip><span className="font-bold">{p.name}</span> <span className="tabular-nums">{p.label}</span></Tip> : null;
          }} />
          <Bar dataKey="offset" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="size" stackId="w" radius={[0, 4, 4, 0]} isAnimationActive={!reduce}>
            {steps.map((s) => <Cell key={s.name} fill={FILL[s.kind]} />)}
            <LabelList dataKey="label" position="right" style={{ fill: "var(--ink)", fontSize: 11, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
