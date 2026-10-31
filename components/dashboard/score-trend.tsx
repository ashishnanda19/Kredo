"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import { score } from "@/lib/mock-data";

type DotProps = { cx?: number; cy?: number; index?: number };

/** Neon score trend: gradient stroke, soft glow, glowing end dot. Colours are decorative; values are in the label. */
export default function ScoreTrend() {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const last = score.history.length - 1;
  const first = score.history[0];
  const end = score.history[last];

  const renderDot = ({ cx, cy, index }: DotProps) => {
    if (cx === undefined || cy === undefined) return <g key={index} />;
    const isLast = index === last;
    return (
      <g key={index}>
        {isLast && <circle cx={cx} cy={cy} r={9} fill="#e11d8f" opacity={0.3} />}
        <circle cx={cx} cy={cy} r={isLast ? 5 : 3} fill={isLast ? "#fff" : "#c4b5fd"} stroke="#e11d8f" strokeWidth={isLast ? 2 : 0} style={isLast ? { filter: "drop-shadow(0 0 6px #e11d8f)" } : undefined} />
      </g>
    );
  };

  return (
    <div role="img" aria-label={`Score trend from ${first.month} to ${end.month}: ${first.score} up to ${end.score}`} className="mt-4 h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={score.history} margin={{ top: 12, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8b5cf6" />
              <stop offset="0.6" stopColor="#e11d8f" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a855f7" stopOpacity={0.4} />
              <stop offset="1" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} interval={0} />
          <YAxis hide domain={["dataMin - 6", "dataMax + 4"]} />
          <Tooltip
            cursor={{ stroke: "rgba(196,181,253,0.4)", strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof score.history)[number] | undefined;
              if (!p) return null;
              return (
                <div className="glass glass-strong rounded-xl px-3 py-1.5 text-xs">
                  <span className="font-bold">{p.month}</span> <span className="tabular-nums text-muted">score {p.score}</span>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={`url(#${id}-s)`}
            strokeWidth={3}
            fill={`url(#${id}-f)`}
            isAnimationActive={!reduce}
            dot={renderDot}
            activeDot={{ r: 6, fill: "#fff", stroke: "#e11d8f", strokeWidth: 2 }}
            style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
