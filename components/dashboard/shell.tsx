"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Gauge, Home, Landmark, LifeBuoy, ReceiptText, ScanLine, UserRound, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Disclosure } from "@/components/shared/demo-tag";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { formatINR } from "@/lib/format";
import { available, student } from "@/lib/mock-data";
import { spring } from "@/lib/theme";
import { cn } from "@/lib/utils";

const PHASE2 = process.env.NEXT_PUBLIC_PHASE2_CREDIT_PROFILE === "true";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/pay", label: "Pay", icon: ScanLine },
  { href: "/dashboard/loans", label: "Loans", icon: Landmark },
  { href: "/dashboard/activity", label: "Activity", icon: ReceiptText },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

/** Extra links shown in the desktop rail only (mobile reaches them from Home and Profile). */
const RAIL_EXTRA: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  ...(PHASE2 ? [{ href: "/dashboard/credit-profile", label: "Credit profile", icon: Gauge }] : []),
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
}

/** Floating glass rail, desktop only. */
export function SideRail() {
  const isActive = useActive();
  return (
    <aside data-side-rail className="sticky top-[var(--bar-h)] hidden h-[calc(100dvh-var(--bar-h))] w-72 shrink-0 p-4 lg:block print:hidden">
      <GlassCard radius="xl" strength="strong" className="flex h-full flex-col justify-between p-5">
        <div>
          <Logo href="/dashboard" />
          <nav aria-label="Dashboard" className="mt-8">
            <ul className="space-y-1">
              {[...NAV, ...RAIL_EXTRA].map((n) => {
                const active = isActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[15px] font-bold transition-colors",
                        active ? "text-pill-fg" : "text-ink-2 hover:bg-ink/10 hover:text-ink",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="rail-active"
                          className="bg-pill text-pill-fg absolute inset-0 rounded-2xl"
                          transition={spring.soft}
                        />
                      )}
                      <n.icon className="relative size-5" aria-hidden />
                      <span className="relative">{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-8 rounded-[20px] bg-ink/[0.07] p-4">
            <p className="text-xs text-ink-2">Available to spend</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{formatINR(available)}</p>
            <p className="mt-1 text-xs text-ink-2">of {formatINR(student.limit)} limit</p>
          </div>
        </div>

        <div className="space-y-3">
          <Disclosure />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-2">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </GlassCard>
    </aside>
  );
}

/** Floating glass tab bar, mobile only. */
export function BottomTabs() {
  const isActive = useActive();
  return (
    <nav aria-label="Dashboard" className="pointer-events-none fixed inset-x-3 bottom-3 z-40 pb-safe lg:hidden print:hidden">
      <GlassCard radius="xl" strength="strong" className="pointer-events-auto mx-auto max-w-md rounded-full p-1.5">
        <ul className="grid grid-cols-5 gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-bold transition-colors",
                    active ? "text-pill-fg" : "text-ink-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-active"
                      className="bg-pill text-pill-fg absolute inset-0 rounded-full"
                      transition={spring.soft}
                    />
                  )}
                  <n.icon className="relative size-5" aria-hidden />
                  <span className="relative">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </nav>
  );
}
