"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, EyeOff, FlaskConical, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";
import { type RiskResult } from "@/lib/ops-risk/api";
import { mask } from "@/lib/ops-risk/labels";
import { useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { AccessRestricted, useRole } from "../common";

const TABS = [
  { href: "/ops/risk", label: "Overview" },
  { href: "/ops/risk/users", label: "Users" },
  { href: "/ops/risk/alerts", label: "Alerts" },
  { href: "/ops/risk/overrides", label: "Overrides" },
  { href: "/ops/risk/config", label: "Config" },
];

export function RiskNav() {
  const path = usePathname();
  const on = (h: string) => (h === "/ops/risk" ? path === h : path.startsWith(h));
  return (
    <nav aria-label="Risk console" className="mb-4 flex gap-1.5 overflow-x-auto">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={on(t.href) ? "page" : undefined} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold", on(t.href) ? "bg-pill text-pill-fg" : "glass glass-soft text-ink-2 hover:text-ink")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Masked identifiers by default; revealing them is a deliberate, audited switch for the whole console. */
const RevealContext = createContext<{ reveal: boolean; setReveal: (v: boolean) => void }>({ reveal: false, setReveal: () => {} });

export function RevealProvider({ children }: { children: React.ReactNode }) {
  const [reveal, setReveal] = useState(false);
  return <RevealContext.Provider value={{ reveal, setReveal }}>{children}</RevealContext.Provider>;
}

export function RevealToggle() {
  const { reveal, setReveal } = useContext(RevealContext);
  const audit = useStore((s) => s.audit);
  const { can } = useRole();
  if (!can("riskView")) return null;
  return (
    <button
      type="button"
      aria-pressed={reveal}
      onClick={() => {
        if (!reveal) audit("Revealed identifiers in the risk console", "Investigation");
        setReveal(!reveal);
      }}
      className="glass glass-soft inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
    >
      {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />} {reveal ? "Mask identifiers" : "Show identifiers"}
    </button>
  );
}

export function Id({ value, className }: { value: string | null | undefined; className?: string }) {
  const { reveal } = useContext(RevealContext);
  return <span className={cn("font-mono text-xs", className)} title={reveal ? undefined : "Masked"}>{reveal ? value ?? "—" : mask(value)}</span>;
}

export function MockBanner({ source }: { source: string | null }) {
  if (source !== "mock") return null;
  return (
    <p role="note" data-testid="risk-mock" className="mb-4 flex items-start gap-2 rounded-2xl bg-ink/[0.06] px-4 py-3 text-sm">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-ink-2" aria-hidden />
      <span>Connect the score service (SCORE_API_URL) for live data and to take actions.</span>
    </p>
  );
}

export function Section({ title, desc, action, children, className, id }: { title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <GlassCard radius="lg" role="region" aria-label={title} id={id} className={cn("p-5", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold">{title}</h2>
          {desc && <p className="text-xs text-ink-2">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  );
}

/** Loading, no access and errors for any console query; renders children with the data once it is there. */
export function Loaded<T>({ result, need, children }: { result: RiskResult<T>; need: string; children: (data: T) => React.ReactNode }) {
  if (result.status === "forbidden") return <AccessRestricted need={need} />;
  if (result.status === "not_found") return <GlassCard radius="lg" className="p-6 text-sm">Nothing found for this id.</GlassCard>;
  if (result.status === "error") return <GlassCard radius="lg" role="alert" className="p-6 text-sm">The score service did not answer. Try again in a moment.</GlassCard>;
  if (result.status === "loading" && !result.data)
    return (
      <div role="status" aria-label="Loading" className="space-y-3">
        <Skeleton className="h-28 w-full rounded-[20px]" />
        <Skeleton className="h-56 w-full rounded-[20px]" />
      </div>
    );
  return <>{result.data && children(result.data)}</>;
}

export function Spinner() {
  return <Loader2 className="size-4 animate-spin" aria-hidden />;
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "bad" | "ok" }) {
  const cls = { neutral: "bg-ink/10 text-ink", warn: "bg-warning-soft text-warn-text", bad: "bg-danger-soft text-bad-text", ok: "bg-success-soft text-ok-text" }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold", cls)}>{children}</span>;
}

export function BandPill({ band }: { band: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
      <span aria-hidden className="size-2.5 rounded-sm" style={{ background: `var(--band-${band.toLowerCase()})` }} /> {band}
    </span>
  );
}
