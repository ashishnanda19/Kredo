"use client";

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import type { AuraHistoryView, MarkerKind } from "@/lib/score/types";

const MARKER_FILL: Record<MarkerKind, string> = {
  repaid_early: "var(--accent)",
  repaid_on_time: "var(--accent)",
  repaid_late: "var(--warn-fill)",
  level_up: "var(--page)",
  level_down: "var(--page)",
};

const short = (iso: string) => new Date(`${iso}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Daily Aura line (one series, 2px) with tappable event markers. Values are in the label and the list below. */
export default function HistoryChart({ history, selected, onSelect, label }: {
  history: AuraHistoryView;
  selected: number | null;
  onSelect: (i: number) => void;
  label: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="img" aria-label={label} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history.days} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="date" tickFormatter={short} tickLine={false} axisLine={false} minTickGap={32} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
          <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
          <Tooltip
            cursor={{ stroke: "var(--ink-3)", strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as { date: string; aura: number } | undefined;
              if (!p) return null;
              return (
                <div className="glass glass-strong rounded-xl px-3 py-1.5 text-xs">
                  <span className="font-semibold">{short(p.date)}</span> <span className="tabular-nums text-ink-2">Aura {p.aura}</span>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="aura" stroke="var(--ink)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--ink)", strokeWidth: 2 }} isAnimationActive={!reduce} />
          {history.markers.map((m, i) =>
            m.aura === null ? null : (
              <ReferenceDot
                key={`${m.date}-${m.kind}-${i}`}
                x={m.date}
                y={m.aura}
                r={selected === i ? 8 : 6}
                fill={MARKER_FILL[m.kind]}
                stroke="var(--ink)"
                strokeWidth={2}
                onClick={() => onSelect(i)}
                style={{ cursor: "pointer" }}
              />
            ),
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
