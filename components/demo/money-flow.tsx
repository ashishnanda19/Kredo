"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ledgerEvents, type LedgerEvent } from "@/lib/demo/ledger";
import { FLOW } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";
import { cn } from "@/lib/utils";

type Kind = "pay" | "settle" | "repay";

/** Where each arrow runs. No arrow ever starts or ends at Kredo: it records, scores and reports, and never holds money. */
const PATH: Record<Kind, string> = {
  pay: "M 235 215 L 565 215",
  settle: "M 470 345 Q 650 345 650 262",
  repay: "M 150 262 Q 150 345 330 345",
};
const LABEL_AT: Record<Kind, [number, number]> = { pay: [400, 200], settle: [610, 372], repay: [190, 372] };

const NODE = { w: 170, h: 84 } as const;
const NODES = {
  student: { x: 65, y: 175, title: FLOW.nodes.student, sub: FLOW.nodes.studentSub },
  vendor: { x: 565, y: 175, title: FLOW.nodes.vendor, sub: FLOW.nodes.vendorSub },
  kredo: { x: 315, y: 14, title: FLOW.nodes.kredo, sub: FLOW.nodes.kredoSub },
  nbfc: { x: 315, y: 305, title: FLOW.nodes.nbfc, sub: FLOW.nodes.nbfcSub },
} as const;

/** The animated proof of the regulatory model: money goes lender to stall and student to lender, never through Kredo. */
export function MoneyFlow({ compact = false, preview = false }: { compact?: boolean; preview?: boolean }) {
  const world = useWorld((s) => s.world);
  const reduce = useReducedMotion();
  const [manual, setManual] = useState<{ kind: Kind; n: number } | null>(null);

  // the latest event that moves value along an arrow; the pulse is keyed by it, so a new event replays the animation
  const latest: LedgerEvent | undefined = ledgerEvents(world, { limit: 40 }).find((e) => e.flow);
  const active: { key: string; kind: Kind; label: string } | null = manual
    ? { key: `m${manual.n}`, kind: manual.kind, label: FLOW.sample[manual.kind] }
    : latest?.flow
      ? { key: latest.id, kind: latest.flow, label: FLOW.label[latest.flow](latest.amount ?? 0) }
      : null;

  return (
    <div data-testid="money-flow" data-active={active?.kind ?? "idle"} data-key={active?.key ?? ""}>
      <svg viewBox="0 0 800 420" role="img" aria-label={FLOW.alt} className={cn("w-full", compact ? "max-h-[260px]" : "max-h-[520px]")}>
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* Kredo's links carry information only: dashed, no arrowheads */}
        {[
          "M 315 56 Q 150 56 150 175",
          "M 485 56 Q 650 56 650 175",
          "M 330 98 C 255 160 255 250 330 305",
        ].map((d) => <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 7" className="text-ink-2" opacity="0.7" />)}
        <text x="400" y="128" textAnchor="middle" className="fill-ink-2 text-[15px]">{FLOW.infoOnly}</text>

        {(Object.keys(PATH) as Kind[]).map((k) => (
          <path key={k} d={PATH[k]} fill="none" stroke="currentColor" strokeWidth="3" markerEnd="url(#flow-arrow)" className={cn("text-ink", active?.kind === k ? "" : "opacity-40")} style={active?.kind === k && !reduce ? { animation: "flow-edge 4s ease-out forwards" } : undefined} />
        ))}

        {(Object.keys(NODES) as (keyof typeof NODES)[]).map((id) => {
          const n = NODES[id];
          return (
            <g key={id} data-testid={`node-${id}`}>
              <rect x={n.x} y={n.y} width={NODE.w} height={NODE.h} rx="20" className={id === "kredo" ? "fill-accent" : "fill-card"} stroke="currentColor" strokeWidth="2" />
              <text x={n.x + NODE.w / 2} y={n.y + 38} textAnchor="middle" className={cn("text-[22px] font-bold", id === "kredo" ? "fill-accent-ink" : "fill-ink")}>{n.title}</text>
              <text x={n.x + NODE.w / 2} y={n.y + 62} textAnchor="middle" className={cn("text-[14px]", id === "kredo" ? "fill-accent-ink" : "fill-ink-2")}>{n.sub}</text>
            </g>
          );
        })}

        {active && (
          <g key={active.key} data-testid="flow-pulse" style={{ animation: "flow-fade 5s ease-out forwards" }}>
            {!reduce && (
              <circle r="11" className="fill-accent" stroke="currentColor" strokeWidth="2">
                <animateMotion dur="1.8s" path={PATH[active.kind]} fill="freeze" />
              </circle>
            )}
            <text x={LABEL_AT[active.kind][0]} y={LABEL_AT[active.kind][1]} textAnchor="middle" className="fill-ink text-[18px] font-bold">{active.label}</text>
          </g>
        )}
      </svg>
      <p className="mt-1 text-center text-sm font-semibold" data-testid="flow-statement">{FLOW.statement}</p>
      {preview && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {(Object.keys(PATH) as Kind[]).map((k) => (
            <button key={k} type="button" data-testid={`preview-${k}`} onClick={() => setManual({ kind: k, n: (manual?.n ?? 0) + 1 })} className="min-h-11 rounded-full border border-hairline px-4 text-sm font-semibold hover:bg-card">
              {FLOW.previewBtn[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
