"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { COPY } from "@/lib/copy";
import { notifications, student } from "@/lib/mock-data";

export function Avatar({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="bg-pill text-pill-fg grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {student.initials}
    </span>
  );
}

/** Home greeting in the landing page's two-tone headline style: the line in ink, the second in grey. */
export function DashboardHeader({ onBell }: { onBell: () => void }) {
  const d = COPY.dashboard;
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between lg:hidden">
        <Logo href="/dashboard" />
        <ThemeToggle />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2">{student.college}</p>
          <h1 className="mt-2 text-balance text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
            <span className="text-ink">{d.greeting(student.firstName)}</span> <span className="text-ink-2/80">{d.greetingSub}</span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GlassButton variant="secondary" size="icon" aria-label={`Notifications, ${notifications.length} new`} onClick={onBell} className="relative">
            <Bell className="size-5" />
            <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-card bg-accent" />
          </GlassButton>
          <Link href="/dashboard/profile" aria-label="Open profile" className="rounded-full transition-transform active:scale-95">
            <Avatar />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Simple title bar for inner screens. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-4 lg:hidden">
          <Logo href="/dashboard" />
        </div>
        <h1 className="text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.045em]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        {action}
        <span className="lg:hidden">
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
}
