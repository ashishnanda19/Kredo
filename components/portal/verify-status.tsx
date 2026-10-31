"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarX2, Hourglass, LockKeyhole, LockKeyholeOpen, PartyPopper, ShieldQuestion, Wrench } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { SuccessCheck } from "@/components/shared/success-check";
import { CoinRain } from "@/components/three/coin-rain";
import { COPY } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { EXPECTED_REVIEW, REJECTION } from "@/lib/mock-data";
import { useHydrated, useStore, VERIFY_ATTEMPT_SOFT_LIMIT } from "@/lib/store/store";
import { StatusPill } from "./status-chip";
import { PortalShell } from "./page-shell";

const T = COPY.status;

export function VerifyStatus() {
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const v = useStore((s) => s.verification);
  const kycStatus = useStore((s) => s.kyc.status);
  const markCelebrated = useStore((s) => s.markCelebrated);
  const startResubmit = useStore((s) => s.startResubmit);
  const [rain, setRain] = useState(0);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (hydrated && !loggedIn) router.replace("/login?next=/verify/status");
  }, [hydrated, loggedIn, router]);

  // celebrate once when the status becomes Accepted
  useEffect(() => {
    if (hydrated && v.status === "accepted" && !v.celebrated) {
      setTimeout(() => setRain(1), 0);
      markCelebrated();
    }
  }, [hydrated, v.status, v.celebrated, markCelebrated]);

  if (!hydrated || !loggedIn) return <PortalShell width="max-w-xl"><div role="status" className="py-16 text-center text-muted">{COPY.gate.loading}</div></PortalShell>;

  const reason = v.reason ? REJECTION[v.reason] : null;
  const showLimit = v.attempts >= VERIFY_ATTEMPT_SOFT_LIMIT && ["rejected", "resubmission", "expired"].includes(v.status);

  function resubmit() {
    startResubmit();
    router.push("/verify");
  }
  function open() {
    setUnlocking(true);
    setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <PortalShell width="max-w-xl" back={{ href: "/dashboard", label: "Dashboard" }}>
      <CoinRain trigger={rain} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{T.title}</h1>
        <StatusPill kind="verification" value={v.status} />
      </div>

      <div className="mt-6" aria-live="polite">
        {v.status === "not_started" && (
          <div className="text-center">
            <ShieldQuestion className="mx-auto size-12 text-neon-violet" aria-hidden />
            <h2 className="mt-3 text-xl font-bold">{T.notStartedTitle}</h2>
            <p className="mt-1 text-muted">{T.notStartedBody}</p>
            <GlassButton asChild size="lg" className="mt-5 w-full">
              <Link href="/verify">{T.start}</Link>
            </GlassButton>
          </div>
        )}

        {v.status === "pending" && (
          <div className="text-center">
            <div className="relative mx-auto grid size-24 place-items-center">
              <span aria-hidden className="absolute inset-0 animate-[pulse-ring_2s_ease-out_infinite] rounded-full bg-neon-violet/30 motion-reduce:hidden" />
              <span aria-hidden className="absolute inset-0 animate-[pulse-ring_2s_ease-out_0.8s_infinite] rounded-full bg-neon-magenta/25 motion-reduce:hidden" />
              <span className="relative grid size-16 place-items-center rounded-full bg-accent-soft text-neon-violet">
                <Hourglass className="size-8" aria-hidden />
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold">{T.pendingTitle}</h2>
            <p className="mt-1 text-muted">{T.pendingBody}</p>
            <dl className="mt-4 rounded-[20px] bg-foreground/[0.06] px-4 text-left text-sm">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted">{T.expected}</dt>
                <dd className="text-right font-semibold">{EXPECTED_REVIEW}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">{T.pendingNext}</p>
            <GlassButton asChild variant="secondary" className="mt-4">
              <Link href="/dashboard/support">{T.contact}</Link>
            </GlassButton>
          </div>
        )}

        {v.status === "accepted" && (
          <div className="text-center">
            <div className="flex justify-center">{unlocking ? <motion.span initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1.1, rotate: 0 }} className="grid size-24 place-items-center rounded-full bg-success text-[#052e16] shadow-[0_0_40px_6px_rgba(74,222,128,0.5)]"><LockKeyholeOpen className="size-12" aria-hidden /></motion.span> : <SuccessCheck size={96} />}</div>
            <h2 className="mt-5 flex items-center justify-center gap-2 text-2xl font-extrabold">
              {T.acceptedTitle} <PartyPopper className="size-6 text-neon-magenta" aria-hidden />
            </h2>
            <p className="mt-1 text-muted">{T.acceptedBody}</p>
            <GlassButton size="lg" className="mt-5 w-full" onClick={open} disabled={unlocking}>
              {unlocking ? "Unlocking…" : T.openDash}
            </GlassButton>
            {kycStatus !== "verified" && (
              <GlassCard radius="lg" className="mt-4 p-4 text-left text-sm">
                <p className="font-bold">Next step: KYC</p>
                <p className="text-muted">Complete a one-time identity check to apply for loans.</p>
                <GlassButton asChild variant="soft" size="sm" className="mt-2">
                  <Link href="/verify/kyc">Go to KYC</Link>
                </GlassButton>
              </GlassCard>
            )}
          </div>
        )}

        {(v.status === "rejected" || v.status === "resubmission") && reason && (
          <div>
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-danger-soft text-danger">
                {v.status === "rejected" ? <AlertTriangle className="size-6" aria-hidden /> : <Wrench className="size-6" aria-hidden />}
              </span>
              <div>
                <h2 className="text-xl font-bold">{v.status === "rejected" ? T.rejectedTitle : T.resubTitle}</h2>
                <p className="mt-1 text-sm text-muted">{v.status === "rejected" ? reason.why : T.resubBody}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[20px] bg-foreground/[0.06] p-4 text-sm">
              {v.status === "resubmission" ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{T.fix}</p>
                  <p className="mt-1 text-base font-bold">{reason.item}</p>
                  <p className="mt-1 text-muted">{reason.fix}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{T.rejectedNext}</p>
                  <p className="mt-1">{reason.fix}</p>
                  <p className="mt-2 text-xs text-muted">Reason: {reason.label}</p>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">Your details are saved. For privacy, ID photos must be selected again.</p>
            <GlassButton size="lg" className="mt-4 w-full" onClick={resubmit}>
              {T.resubmit}
            </GlassButton>
          </div>
        )}

        {v.status === "expired" && (
          <div className="text-center">
            <CalendarX2 className="mx-auto size-12 text-warning" aria-hidden />
            <h2 className="mt-3 text-xl font-bold">{T.expiredTitle}</h2>
            <p className="mt-1 text-muted">{T.expiredBody}</p>
            <GlassButton size="lg" className="mt-5 w-full" onClick={resubmit}>
              {T.reverify}
            </GlassButton>
          </div>
        )}
      </div>

      {v.attempts > 0 && (
        <p className="mt-4 text-xs font-semibold text-muted">
          {T.attempt(v.attempts)}
          {v.submittedAt ? `, submitted ${formatDate(v.submittedAt)}` : ""}
        </p>
      )}

      {showLimit && (
        <div role="note" className="mt-4 rounded-[20px] bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <LockKeyhole className="size-4" aria-hidden /> {T.limitTitle}
          </p>
          <p className="mt-1">{T.limitBody}</p>
          <Link href="/dashboard/support" className="mt-2 inline-block font-bold text-neon-blue">
            {T.contact}
          </Link>
        </div>
      )}

      {v.timeline.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold">{T.timeline}</h2>
          <ol className="mt-3 space-y-3 border-l border-foreground/20 pl-4">
            {[...v.timeline].reverse().map((e) => (
              <li key={e.id} className="relative text-sm">
                <span aria-hidden className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-neon-violet shadow-[0_0_8px_var(--glow)]" />
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-muted">
                  {formatDate(e.at)}
                  {e.detail ? ` · ${e.detail}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </PortalShell>
  );
}
