"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertOctagon, BarChart3, ClipboardCheck, Landmark, LifeBuoy, Search, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AuditDrawer } from "./audit-drawer";
import { useRole } from "./common";

const NAV = [
  { href: "/ops", label: "Overview", icon: BarChart3 },
  { href: "/ops/verifications", label: "Verifications", icon: ClipboardCheck },
  { href: "/ops/fraud", label: "Fraud", icon: ShieldAlert },
  { href: "/ops/loans", label: "Loans", icon: Landmark },
  { href: "/ops/support", label: "Support", icon: LifeBuoy },
];

export function OpsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { label } = useRole();
  const [q, setQ] = useState("");
  const active = (h: string) => (h === "/ops" ? path === h : path.startsWith(h));

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--bar-h))] max-w-[1400px] gap-4 p-3 sm:p-4">
      <aside className="sticky top-[calc(var(--bar-h)+1rem)] hidden h-[calc(100dvh-var(--bar-h)-2rem)] w-56 shrink-0 lg:block">
        <GlassCard radius="xl" strength="strong" className="flex h-full flex-col justify-between p-4">
          <div>
            <Logo href="/ops" />
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-warn-text">Internal tools</p>
            <nav aria-label="Operations" className="mt-5">
              <ul className="space-y-1">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("relative flex min-h-11 items-center gap-2.5 rounded-2xl px-3 text-sm font-bold", active(n.href) ? "text-pill-fg" : "text-ink-2 hover:bg-ink/10 hover:text-ink")}>
                      {active(n.href) && <motion.span layoutId="ops-active" transition={spring.soft} className="bg-pill text-pill-fg absolute inset-0 rounded-2xl" />}
                      <n.icon className="relative size-4" aria-hidden />
                      <span className="relative">{n.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <p className="text-xs text-ink-2">
            Role: <span className="font-bold text-ink">{label}</span>
            <br />
            Change it in Demo Controls.
          </p>
        </GlassCard>
      </aside>

      <div className="min-w-0 flex-1">
        <div role="note" className="mb-3 flex items-center gap-2 rounded-2xl border border-warn/50 bg-warning-soft px-4 py-2 text-sm font-bold text-warn-text">
          <AlertOctagon className="size-4 shrink-0" aria-hidden /> Internal, demo only. Not the student app. All data is fictional and masked.
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <nav aria-label="Operations (mobile)" className="flex w-full gap-1 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold", active(n.href) ? "bg-pill text-pill-fg" : "glass glass-soft")}>
                <n.icon className="size-4" aria-hidden /> {n.label}
              </Link>
            ))}
          </nav>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/ops/verifications?q=${encodeURIComponent(q.trim())}`);
            }}
            className="relative min-w-[200px] flex-1"
          >
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by application ID or masked identifier" placeholder="Search application ID or masked identifier" className="glass glass-soft min-h-11 w-full rounded-full pl-10 pr-4 text-sm placeholder:text-ink-2/80 focus-visible:outline-none" />
          </form>
          <AuditDrawer />
          <ThemeToggle />
        </div>

        <main id="main">{children}</main>
      </div>
    </div>
  );
}
