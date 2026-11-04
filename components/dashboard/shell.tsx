"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gauge,
  Home,
  Landmark,
  LifeBuoy,
  ReceiptText,
  ScanLine,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Disclosure } from "@/components/shared/demo-tag";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { formatINR } from "@/lib/format";
import { available, student } from "@/lib/mock-data";
import { useWorldStudent } from "@/components/student/use-student";
import { availableLimit, outstandingPrincipalOf, studentState } from "@/lib/domain/selectors";
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
  ...(PHASE2
    ? [
        {
          href: "/dashboard/aura",
          label: "Aura",
          icon: Gauge,
        },
      ]
    : []),
];

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/**
 * Desktop rail, in the landing page's language: the lockup, pill nav (ink pill for the current page), and the
 * available limit on a signal-yellow tile like the landing splash. Flat, with one hairline against the content.
 */
export function SideRail() {
  const isActive = useActive();
  const onHome = usePathname() === "/dashboard";
  const ws = useWorldStudent();
  // a signed-in demo-world student sees their own limit; otherwise the original fixed demo figures
  const live = ws.studentId ? { avail: availableLimit(ws.world, ws.studentId), limit: studentState(ws.world, ws.studentId).limit, used: outstandingPrincipalOf(ws.world, ws.studentId) } : null;
  const availNow = live ? live.avail : available;
  const limitNow = live ? live.limit : student.limit;
  const used = live ? live.used : student.limit - available;
  return (
    <aside className="sticky top-[var(--bar-h)] hidden h-[calc(100dvh-var(--bar-h))] w-72 shrink-0 border-r border-hairline lg:block print:hidden">
      <div className="flex h-full flex-col justify-between px-5 py-6">
        <div>
          <Logo href="/dashboard" className="px-2" />
          <nav aria-label="Dashboard" className="mt-8">
            <ul className="space-y-0.5">
              {[...NAV, ...RAIL_EXTRA, ...(ws.studentId && !PHASE2 ? [{ href: "/dashboard/aura", label: "Aura", icon: Gauge }] : [])].map((n) => {
                const active = isActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-11 items-center gap-3 rounded-full px-4 text-[14.5px] font-medium tracking-[-0.01em] transition-colors",
                        active
                          ? "text-pill-fg"
                          : "text-ink-2 hover:bg-card hover:text-ink",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="rail-active"
                          className="absolute inset-0 rounded-full bg-pill"
                          transition={spring.soft}
                        />
                      )}
                      <n.icon className="relative size-[18px]" aria-hidden />
                      <span className="relative">{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* the limit tile; on Home the yellow limit panel already shows it */}
          {!onHome && (
            <div className="theme-light relative mt-8 overflow-hidden rounded-[20px] bg-accent p-4 text-[#0b0b0c]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_20%_0%,rgba(255,250,214,0.7),transparent_60%)]"
              />
              <div
                aria-hidden
                className="grain pointer-events-none absolute inset-0 opacity-[0.08]"
              />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b0b0c]/60">
                  Available to spend
                </p>
                <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                  {formatINR(availNow)}
                </p>
                <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[#0b0b0c]/15">
                  <span
                    className="block h-full rounded-full bg-[#0b0b0c]"
                    style={{ width: `${limitNow ? (used / limitNow) * 100 : 0}%` }}
                  />
                </span>
                <p className="mt-2 text-[12px] font-medium text-[#0b0b0c]/65">
                  of {formatINR(limitNow)} limit
                </p>
                <Link
                  href="/dashboard/pay"
                  className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#0b0b0c] px-3.5 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.97]"
                >
                  <ScanLine className="size-3.5" aria-hidden /> Scan and pay
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 px-2">
          <Disclosure />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-2">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Frosted pill tab bar, mobile only (the landing page's floating nav, at the bottom). */
export function BottomTabs() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Dashboard"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-40 pb-safe lg:hidden print:hidden"
    >
      <div className="frost pointer-events-auto mx-auto max-w-md rounded-full p-1.5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.25)]">
        <ul className="grid grid-cols-5 gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors",
                    active ? "text-pill-fg" : "text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-active"
                      className="absolute inset-0 rounded-full bg-pill"
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
      </div>
    </nav>
  );
}
