"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { SETTLE } from "@/lib/copy-demo";
import { awaitingSettlement, vendorFacingStudent } from "@/lib/domain/selectors";
import { fmtDate, fmtDateTime } from "@/lib/domain/time";
import type { Settlement, SettlementStatus, WorldState } from "@/lib/domain/types";
import { downloadPdf, settlementPdf } from "@/lib/demo/pdf";
import { downloadText, linesCsv, reportJson } from "@/lib/settlement-report";
import { useWorld } from "@/lib/store/world";

const TONE: Record<SettlementStatus, "neutral" | "warning" | "success" | "danger"> = { scheduled: "neutral", processing: "warning", paid: "success", failed: "danger", on_hold: "warning" };

function detailLine(s: Settlement): string {
  if (s.status === "paid") return SETTLE.ref(s.reference ?? s.id);
  if (s.status === "failed") return SETTLE.failed(s.failureReason ?? "");
  if (s.status === "on_hold") return SETTLE.hold;
  return "";
}

function SettlementItem({ world, s }: { world: WorldState; s: Settlement }) {
  const [open, setOpen] = useState(false);
  return (
    <li data-testid="settlement-row" data-status={s.status} className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{fmtDate(s.date)}</p>
          <p className="text-xs text-ink-2">{SETTLE.payments(s.count)} · {s.id}</p>
          {detailLine(s) && <p data-testid="settlement-detail" className="mt-0.5 text-xs text-ink-2">{detailLine(s)}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-base font-bold tabular-nums">₹{s.totalAmount}</p>
          <Badge tone={TONE[s.status]}>{SETTLE.status[s.status]}</Badge>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <GlassButton size="sm" variant="ghost" className="min-h-9 px-3 text-xs" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? SETTLE.hide : SETTLE.show}</GlassButton>
        <GlassButton size="sm" variant="ghost" className="min-h-9 px-3 text-xs" data-testid="dl-csv" onClick={() => downloadText(`${s.id}.csv`, linesCsv(world, [s]), "text/csv")}><Download className="size-3.5" aria-hidden /> {SETTLE.csv}</GlassButton>
        <GlassButton size="sm" variant="ghost" className="min-h-9 px-3 text-xs" data-testid="dl-pdf" onClick={() => void settlementPdf(world, [s]).then((d) => downloadPdf(`${s.id}.pdf`, d))}><Download className="size-3.5" aria-hidden /> {SETTLE.pdf}</GlassButton>
        <GlassButton size="sm" variant="ghost" className="min-h-9 px-3 text-xs" data-testid="dl-json" onClick={() => downloadText(`${s.id}.json`, reportJson(world, [s]), "application/json")}><Download className="size-3.5" aria-hidden /> {SETTLE.json}</GlassButton>
      </div>
      {open && (
        <ul className="mt-2 divide-y divide-hairline rounded-2xl bg-card px-3 text-sm" data-testid="settlement-lines">
          {s.loanIds.map((id) => {
            const l = world.loans[id];
            return l ? <li key={id} className="flex justify-between gap-3 py-2"><span className="min-w-0 truncate">{vendorFacingStudent(world, l.studentId)} <span className="text-xs text-ink-2">{fmtDateTime(l.createdAt)}</span></span><span className="tabular-nums">{l.coins}</span></li> : null;
          })}
          {s.adjustmentIds.map((id) => {
            const a = world.adjustments.find((x) => x.id === id);
            return a ? <li key={id} className="flex justify-between gap-3 py-2"><span>{SETTLE.adj}: {a.reason}</span><span className="tabular-nums">{a.coins}</span></li> : null;
          })}
        </ul>
      )}
    </li>
  );
}

export function SettlementsPage() {
  const world = useWorld((s) => s.world);
  const vendorId = useWorld((s) => s.session.vendorId);
  if (!vendorId) return null;
  const mine = Object.values(world.settlements).filter((s) => s.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date));
  const awaiting = awaitingSettlement(world, vendorId);
  const carry = -world.adjustments.filter((a) => a.vendorId === vendorId && !a.settlementId).reduce((s, a) => s + a.coins, 0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{SETTLE.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{SETTLE.sub}</p>
      </div>
      <GlassCard radius="xl" strength="strong" className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-2">{SETTLE.awaiting}</p>
        <p data-testid="settle-awaiting" className="mt-1 text-3xl font-extrabold tabular-nums">₹{awaiting}</p>
        <p className="mt-1 text-sm text-ink-2">{SETTLE.next}: {SETTLE.nextAt}</p>
        {carry > 0 && <p data-testid="carry" className="mt-2 text-sm font-semibold">{SETTLE.adjustments(carry)}</p>}
      </GlassCard>
      <GlassCard radius="lg" className="p-5">
        <h2 className="text-base font-bold">{SETTLE.history}</h2>
        {mine.length === 0 ? <p className="py-6 text-center text-sm text-ink-2">{SETTLE.empty}</p> : <ul className="divide-y divide-hairline">{mine.slice(0, 30).map((s) => <SettlementItem key={s.id} world={world} s={s} />)}</ul>}
      </GlassCard>
    </div>
  );
}
