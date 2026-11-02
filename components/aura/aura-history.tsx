"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight, CalendarCheck, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { GlassSegmented } from "@/components/glass/glass-segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { AURA } from "@/lib/copy-aura";
import { formatDate } from "@/lib/format";
import type { MarkerKind } from "@/lib/score/types";
import { useAuraHistory } from "@/lib/score/use-aura";
import { cn } from "@/lib/utils";
import { NoScore, UnavailableBanner } from "./parts";

// Recharts is heavy: client only, loaded on this screen
const HistoryChart = dynamic(() => import("./history-chart"), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });

const ICON: Record<MarkerKind, typeof Zap> = {
  repaid_early: Zap,
  repaid_on_time: CalendarCheck,
  repaid_late: Clock,
  level_up: ArrowUpRight,
  level_down: ArrowDownRight,
};

export function AuraHistory() {
  const T = AURA.history;
  const [days, setDays] = useState("90");
  const [selected, setSelected] = useState<number | null>(null);
  const { status, history } = useAuraHistory(Number(days));

  return (
    <div className="space-y-5" data-testid="aura-history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">{T.subtitle}</p>
        <GlassSegmented label="Range" value={days} onChange={(v) => { setDays(v); setSelected(null); }} options={T.ranges.map((r) => ({ value: String(r.days), label: r.label }))} />
      </div>

      {status === "loading" && <Skeleton className="h-80 w-full rounded-[20px]" />}
      {status === "no_score" && <NoScore />}
      {status === "unavailable" && <UnavailableBanner updatedAt={null} />}

      {status === "ok" && history && (
        <>
          <GlassCard radius="lg" className="p-5">
            <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{T.title}</h2>
            {history.days.length < 2 ? (
              <p className="mt-2 text-sm text-ink-2">{T.empty}</p>
            ) : (
              <>
                <HistoryChart
                  history={history}
                  selected={selected}
                  onSelect={setSelected}
                  label={T.chartLabel(history.days[0].aura, history.days.at(-1)!.aura, Number(days))}
                />
                {history.frozen && <p className="mt-2 text-xs text-ink-2">{T.frozen}</p>}
              </>
            )}
          </GlassCard>

          {history.markers.length > 0 && (
            <GlassCard radius="lg" className="p-5">
              <p className="mb-3 text-sm text-ink-2">{T.tapHint}</p>
              {selected !== null && history.markers[selected] && (
                <p role="status" className="mb-3 rounded-2xl bg-ink/[0.06] px-4 py-3 text-sm font-semibold">{history.markers[selected].text}</p>
              )}
              <ul className="space-y-1.5">
                {history.markers.map((m, i) => {
                  const Icon = ICON[m.kind];
                  return (
                    <li key={`${m.date}-${m.kind}-${i}`}>
                      <button
                        type="button"
                        aria-pressed={selected === i}
                        onClick={() => setSelected(i)}
                        className={cn("flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm transition-colors", selected === i ? "bg-ink/10" : "hover:bg-ink/[0.06]")}
                      >
                        <Icon className={cn("size-4 shrink-0", m.kind === "repaid_late" || m.kind === "level_down" ? "text-warn-text" : "text-ink")} aria-hidden />
                        <span className="font-semibold">{m.label}</span>
                        <span className="ml-auto text-xs text-ink-2">{formatDate(m.date)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
