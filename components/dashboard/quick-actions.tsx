"use client";

import Link from "next/link";
import { ArrowUpRight, History, ScanLine, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  sub: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

/**
 * Action tiles in the style of the landing page's three-step strip: a yellow icon on an ink tile, a label and one
 * quiet line. The primary action ("Scan and pay") is the ink tile.
 */
export function QuickActions({ onRepay, onIncrease }: { onRepay: () => void; onIncrease: () => void }) {
  const q = COPY.dashboard.quick;
  const s = COPY.dashboard.quickSub;
  const actions: Action[] = [
    { label: q.scan, sub: s.scan, icon: ScanLine, href: "/dashboard/pay", primary: true },
    { label: q.repay, sub: s.repay, icon: Wallet, onClick: onRepay },
    { label: q.increase, sub: s.increase, icon: TrendingUp, onClick: onIncrease },
    { label: q.history, sub: s.history, icon: History, href: "/dashboard/activity" },
  ];

  return (
    <Stagger inView={false} className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="list" aria-label="Quick actions">
      {actions.map((a) => {
        const inner = (
          <>
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-[12px] transition-transform duration-300 group-hover:-rotate-6",
                a.primary ? "bg-accent text-[#0b0b0c]" : "bg-[#0b0b0c] text-accent dark:bg-white/[0.08]",
              )}
            >
              <a.icon className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[13.5px] font-semibold leading-snug tracking-[-0.01em] sm:text-[14.5px]">{a.label}</span>
              <span className={cn("mt-0.5 hidden text-[12.5px] leading-snug sm:block", a.primary ? "text-pill-fg/65" : "text-ink-2")}>{a.sub}</span>
            </span>
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 self-start opacity-50 max-sm:hidden transition-[transform,opacity] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </>
        );
        const cls = cn(
          "group flex h-full min-h-[84px] w-full items-center gap-3 rounded-[18px] p-4 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 active:scale-[0.98] max-sm:min-h-[64px] max-sm:p-3",
          a.primary ? "bg-pill text-pill-fg" : "bg-card text-ink",
        );
        return (
          <StaggerItem key={a.label} role="listitem" className="h-full">
            {a.href ? (
              <Link href={a.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={a.onClick} className={cls}>
                {inner}
              </button>
            )}
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
