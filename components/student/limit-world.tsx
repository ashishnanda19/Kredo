"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { LIMIT_W } from "@/lib/copy-demo";
import { ladderView } from "@/lib/domain/limit";
import { fmtDate, istDate } from "@/lib/domain/time";
import { useWorldStudent } from "./use-student";

const TONE = { reached: "neutral", current: "accent", next: "warning", locked: "neutral" } as const;
const LABEL = { reached: LIMIT_W.reached, current: LIMIT_W.current, next: LIMIT_W.next, locked: LIMIT_W.locked };

/** The limit ladder: where you are, what the next step needs, and what moved your limit before. */
export function LimitWorld() {
  const { world, studentId } = useWorldStudent();
  if (!studentId) return null;
  const v = ladderView(world, studentId);
  return (
    <div className="space-y-5" data-testid="limit-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{LIMIT_W.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{LIMIT_W.sub}</p>
      </div>
      <GlassCard radius="xl" strength="strong" className="p-5">
        <ol className="divide-y divide-hairline" data-testid="ladder">
          {v.rows.map((r) => (
            <li key={r.level} data-testid={`ladder-${r.level}`} data-status={r.status} aria-current={r.status === "current" ? "step" : undefined} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className={`font-bold tabular-nums ${r.status === "locked" ? "text-ink-2" : ""}`}>{r.limit} coins</p>
                <p className="text-xs text-ink-2">Step {r.level} · {r.minAura > 0 ? LIMIT_W.minAura(r.minAura) : "Starting step"}</p>
              </div>
              <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
            </li>
          ))}
        </ol>
      </GlassCard>

      <GlassCard radius="lg" className="space-y-2 p-5">
        {v.nextLevel === null ? (
          <p className="text-sm font-semibold">{LIMIT_W.atTop}</p>
        ) : v.pendingApproval ? (
          <p className="text-sm font-semibold" data-testid="pending-note">{LIMIT_W.pending}</p>
        ) : (
          <>
            <h2 className="text-sm font-bold">{LIMIT_W.needs} {v.nextLimit} coins:</h2>
            {v.needs.length === 0 ? <p className="text-sm text-ink-2">{LIMIT_W.noneMissing}</p> : <ul data-testid="needs" className="list-disc space-y-1 pl-5 text-sm">{v.needs.map((n) => <li key={n}>{n}</li>)}</ul>}
          </>
        )}
        {v.postDefaultCap !== null && <p className="text-sm text-ink-2" data-testid="cap-note">{LIMIT_W.cap(v.postDefaultCap)}</p>}
      </GlassCard>

      <GlassCard radius="lg" className="p-5">
        <h2 className="text-base font-bold">{LIMIT_W.history}</h2>
        {v.history.length === 0 ? (
          <p className="py-4 text-sm text-ink-2">{LIMIT_W.historyEmpty}</p>
        ) : (
          <ul className="divide-y divide-hairline" data-testid="limit-history">
            {v.history.map((c) => (
              <li key={`${c.at}-${c.to}`} className="py-3 text-sm">
                <p className="font-semibold">{c.fromLimit} to {c.toLimit} coins</p>
                <p className="text-xs text-ink-2">{fmtDate(istDate(c.at))} · {c.why}</p>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
      <Link href="/dashboard/aura" className="inline-block text-sm font-semibold underline">Back to Aura</Link>
    </div>
  );
}
