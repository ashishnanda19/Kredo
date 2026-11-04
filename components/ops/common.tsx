"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, ShieldOff } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFakeLoad } from "@/lib/hooks";
import { can, ROLE_LABEL, type Capability } from "@/lib/ops-permissions";
import { useHydrated, useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";

const dt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDT = (iso: string) => dt.format(new Date(iso));

export function useRole() {
  const hydrated = useHydrated();
  const role = useStore((s) => s.ops.role);
  return { role, hydrated, label: ROLE_LABEL[role], can: (c: Capability) => can(role, c) };
}

export function OpsPage({ title, desc, actions, children }: { title: string; desc?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {desc && <p className="text-sm text-ink-2">{desc}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

/** Polite "Access restricted" screen for roles that may not open a page. */
export function AccessRestricted({ need }: { need: string }) {
  const { label } = useRole();
  return (
    <GlassCard radius="xl" strength="strong" role="alert" className="mx-auto mt-10 max-w-md p-8 text-center">
      <ShieldOff className="mx-auto size-10 text-warn-text" aria-hidden />
      <h1 className="mt-4 text-xl font-extrabold">Access restricted</h1>
      <p className="mt-2 text-sm text-ink-2">
        This page is for {need}. You are signed in as <span className="font-semibold text-ink">{label}</span>. If you think you need access, ask an admin.
      </p>
      <GlassButton asChild variant="secondary" className="mt-5">
        <Link href="/ops">Back to overview</Link>
      </GlassButton>
    </GlassCard>
  );
}

/** A control the current role may not use: disabled, with a tooltip that says why. */
export function Guarded({ allowed, why, children }: { allowed: boolean; why: string; children: React.ReactNode }) {
  if (allowed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} aria-label={why} className="inline-flex cursor-not-allowed items-center gap-1 opacity-60">
          <span className="pointer-events-none inline-flex" aria-disabled>
            {children}
          </span>
          <Lock className="size-3.5 shrink-0" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>{why}</TooltipContent>
    </Tooltip>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/** Dense, accessible table with a skeleton while loading and an empty state. */
export function DataTable<T>({ caption, columns, rows, rowKey, onRow, empty, loadMs = 500, rowClass }: { caption: string; columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; empty: string; loadMs?: number; rowClass?: (r: T) => string }) {
  const ready = useFakeLoad(loadMs);
  if (!ready)
    return (
      <div role="status" aria-label={`Loading ${caption}`} className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
        <span className="sr-only">Loading…</span>
      </div>
    );
  if (rows.length === 0) return <p className="rounded-2xl bg-ink/[0.05] px-4 py-8 text-center text-sm text-ink-2">{empty}</p>;
  return (
    <div tabIndex={0} role="region" aria-label={caption} className="overflow-x-auto rounded-[16px] bg-elevated ring-1 ring-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-[11px] uppercase tracking-wider text-ink-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("whitespace-nowrap border-b border-hairline px-3 py-2.5 font-semibold", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={rowKey(r)} className={cn(onRow && "cursor-pointer hover:bg-soft", rowClass?.(r))} onClick={onRow ? () => onRow(r) : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 align-middle", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "warn" | "danger" | "ok" }) {
  return (
    <GlassCard radius="md" className="p-4">
      <p className="text-xs font-semibold text-ink-2">{label}</p>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", tone === "danger" && "text-bad-text", tone === "warn" && "text-warn-text", tone === "ok" && "text-ok-text")}>{value}</p>
      {hint && <p className="text-[11px] text-ink-2">{hint}</p>}
    </GlassCard>
  );
}

/** Simple confirm-with-reason hook used by every audited action. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  return {
    msg,
    show: (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 4000);
    },
  };
}

export function Toast({ msg }: { msg: string | null }) {
  return msg ? (
    <p role="status" className="fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 rounded-full bg-ok px-4 py-2 text-sm font-bold text-[#052e16] shadow-lg print:hidden">
      {msg}
    </p>
  ) : null;
}
