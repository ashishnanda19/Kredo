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
      className="gradient-neon grid shrink-0 place-items-center rounded-full font-bold text-white shadow-[0_0_20px_-4px_rgba(168,85,247,0.8)]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {student.initials}
    </span>
  );
}

export function DashboardHeader({ onBell }: { onBell: () => void }) {
  return (
    <header className="space-y-3">
      <div className="lg:hidden">
        <Logo href="/dashboard" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/profile" className="flex min-w-0 items-center gap-3 rounded-full pr-3" aria-label="Open profile">
          <Avatar />
          <div className="min-w-0">
            <p className="text-sm text-muted">{COPY.dashboard.hey}</p>
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{student.firstName}</h1>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <GlassButton variant="secondary" size="icon" aria-label={`Notifications, ${notifications.length} new`} onClick={onBell} className="relative">
            <Bell className="size-5" />
            <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-background bg-neon-magenta shadow-[0_0_8px_var(--glow-magenta)]" />
          </GlassButton>
          <span className="lg:hidden">
            <ThemeToggle />
          </span>
        </div>
      </div>
    </header>
  );
}

/** Simple title bar for inner screens. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
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
