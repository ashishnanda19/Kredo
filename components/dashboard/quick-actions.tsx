"use client";

import Link from "next/link";
import { History, ScanLine, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export function QuickActions({ onRepay, onIncrease }: { onRepay: () => void; onIncrease: () => void }) {
  const actions: Action[] = [
    { label: "Scan and pay", icon: ScanLine, href: "/dashboard/pay", primary: true },
    { label: "Repay now", icon: Wallet, onClick: onRepay },
    { label: "Request limit increase", icon: TrendingUp, onClick: onIncrease },
    { label: "History", icon: History, href: "/dashboard/activity" },
  ];

  return (
    <Stagger inView={false} className="grid grid-cols-4 gap-2 sm:gap-4" role="list" aria-label="Quick actions">
      {actions.map((a) => {
        const inner = (
          <>
            <span
              className={cn(
                "grid size-14 place-items-center rounded-2xl transition-transform group-hover:-translate-y-0.5 group-active:scale-95",
                a.primary ? "bg-pill text-pill-fg" : "bg-ink/[0.07] text-ink",
              )}
            >
              <a.icon className="size-6" aria-hidden />
            </span>
            <span className="text-center text-xs font-semibold leading-tight sm:text-sm">{a.label}</span>
          </>
        );
        const cls = "group flex min-h-[88px] flex-col items-center gap-2 rounded-2xl py-1";
        return (
          <StaggerItem key={a.label} role="listitem">
            {a.href ? (
              <Link href={a.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={a.onClick} className={cn(cls, "w-full")}>
                {inner}
              </button>
            )}
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
