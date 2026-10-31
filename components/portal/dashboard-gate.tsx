"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/copy";
import { useHydrated, useStore } from "@/lib/store/store";
import { IdleTimeout, LockedAccountScreen, NewDeviceAlert, SessionExpiredScreen } from "./session-overlays";

/** Reachable even before verification (help and account pages). Everything else needs an accepted verification. */
const OPEN_WHEN_UNVERIFIED = ["/dashboard/profile", "/dashboard/support"];

function GateSkeleton() {
  return (
    <div role="status" aria-label={COPY.gate.loading} className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full rounded-[28px]" />
      <Skeleton className="h-32 w-full rounded-[24px]" />
    </div>
  );
}

/** Blurred, non-interactive glass preview of the dashboard with a call to action on top. */
function GateLock({ status }: { status: string }) {
  const t = COPY.gate;
  const pending = status === "pending";
  const started = status !== "not_started";
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none space-y-4 opacity-70 blur-md">
        <GlassCard radius="xl" strength="strong" className="h-44" />
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard radius="lg" className="h-52" />
          <GlassCard radius="lg" className="h-52" />
        </div>
        <GlassCard radius="lg" className="h-40" />
      </div>
      <div className="absolute inset-0 grid place-items-start justify-items-center pt-10 sm:pt-16">
        <GlassCard radius="xl" strength="strong" role="region" aria-label={t.lockedTitle} className="max-w-md p-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-ink">
            <LockKeyhole className="size-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{pending ? COPY.status.pendingTitle : t.lockedTitle}</h1>
          <p className="mt-2 text-ink-2">{pending ? t.pendingBody : t.lockedBody}</p>
          <GlassButton asChild size="lg" className="mt-6 w-full">
            <Link href={started ? "/verify/status" : "/verify"}>{started ? t.statusCta : t.lockedCta}</Link>
          </GlassButton>
          <p className="mt-3 text-xs text-ink-2">{COPY.legal.disclosure}</p>
        </GlassCard>
      </div>
    </div>
  );
}

/** Wraps /dashboard/*: login check, session edge cases, idle timeout and verification gating. */
export function DashboardGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const path = usePathname();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const edge = useStore((s) => s.session.edge);
  const status = useStore((s) => s.verification.status);

  useEffect(() => {
    if (hydrated && !loggedIn && edge === "none") router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [hydrated, loggedIn, edge, router, path]);

  if (!hydrated) return <GateSkeleton />;
  if (edge === "locked") return <LockedAccountScreen />;
  if (edge === "session_expired") return <SessionExpiredScreen />;
  if (!loggedIn) return <GateSkeleton />;

  const allowed = status === "accepted" || OPEN_WHEN_UNVERIFIED.some((p) => path.startsWith(p));
  return (
    <>
      {edge === "suspicious" && <NewDeviceAlert />}
      <IdleTimeout />
      {allowed ? children : <GateLock status={status} />}
    </>
  );
}
