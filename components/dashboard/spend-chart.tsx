"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useReducedMotion } from "framer-motion";
import { CATEGORY_COLOR, CategoryIcon } from "@/components/shared/category-icon";
import { formatINR } from "@/lib/format";
import { spendByCategory, transactions, type Category } from "@/lib/mock-data";

type Datum = ReturnType<typeof spendByCategory>[number];

/**
 * Donut of spend by category. Colours are fixed per category (not per rank).
 * The legend underneath carries the exact values, so colour is never the only cue.
 */
export default function SpendChart() {
  const data = spendByCategory(transactions);
  const total = data.reduce((s, d) => s + d.value, 0);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Category | null>(null);
  const focus = data.find((d) => d.category === active);

  return (
    <div>
      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
              cornerRadius={6}
              isAnimationActive={!reduce}
              animationDuration={900}
              onMouseEnter={(_, i) => setActive(data[i].category)}
              onMouseLeave={() => setActive(null)}
            >
              {data.map((d) => (
                <Cell key={d.category} fill={CATEGORY_COLOR[d.category]} opacity={active && active !== d.category ? 0.35 : 1} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                const p = payload?.[0]?.payload as Datum | undefined;
                if (!p) return null;
                return (
                  <div className="rounded-xl border border-line bg-foreground/[0.07] px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold">{p.name}</p>
                    <p className="tabular-nums text-muted">
                      {formatINR(p.value)} · {Math.round((p.value / total) * 100)}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-muted">{focus ? focus.name : "Total spent"}</p>
            <p className="text-xl font-extrabold tabular-nums">{formatINR(focus ? focus.value : total)}</p>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1">
        {data.map((d) => (
          <li
            key={d.category}
            onMouseEnter={() => setActive(d.category)}
            onMouseLeave={() => setActive(null)}
            className="flex min-h-9 items-center gap-3 text-sm"
          >
            <span aria-hidden className="size-3 shrink-0 rounded-[4px]" style={{ background: CATEGORY_COLOR[d.category] }} />
            <CategoryIcon category={d.category} className="size-7 rounded-lg [&_svg]:size-3.5" />
            <span className="flex-1">{d.name}</span>
            <span className="tabular-nums text-muted">{Math.round((d.value / total) * 100)}%</span>
            <span className="w-16 text-right font-semibold tabular-nums">{formatINR(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
