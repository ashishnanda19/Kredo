"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldAlert, Smartphone, TimerReset } from "lucide-react";
import { GlassButton, GlassCard, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { useStore } from "@/lib/store/store";

export function SessionExpiredScreen() {
  const t = COPY.session;
  const logout = useStore((s) => s.logout);
  const setEdge = useStore((s) => s.setEdge);
  const router = useRouter();
  return (
    <GlassCard radius="xl" strength="strong" className="mx-auto mt-10 max-w-md p-7 text-center">
      <TimerReset className="mx-auto size-10 text-info-text" aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold">{t.expiredTitle}</h1>
      <p className="mt-2 text-ink-2">{t.expiredBody}</p>
      <GlassButton
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          setEdge("none");
          logout();
          router.replace("/login");
        }}
      >
        {t.expiredCta}
      </GlassButton>
    </GlassCard>
  );
}

export function LockedAccountScreen() {
  const t = COPY.session;
  return (
    <GlassCard radius="xl" strength="strong" className="mx-auto mt-10 max-w-md p-7 text-center" role="alert">
      <LockKeyhole className="mx-auto size-10 text-ink-2" aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold">{t.lockedTitle}</h1>
      <p className="mt-2 text-ink-2">{t.lockedBody}</p>
      <p className="mt-3 text-sm">{t.lockedHow}</p>
      <div className="mt-6 flex flex-col gap-2">
        <GlassButton asChild size="lg">
          <Link href="/recover">{t.unlockCta}</Link>
        </GlassButton>
        <GlassButton asChild variant="secondary" size="lg">
          <Link href="/dashboard/support">{t.supportCta}</Link>
        </GlassButton>
      </div>
    </GlassCard>
  );
}

/** "New device detected": blocks until the user confirms or secures the account. */
export function NewDeviceAlert() {
  const t = COPY.session;
  const setEdge = useStore((s) => s.setEdge);
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const [secured, setSecured] = useState(false);
  return (
    <GlassSheet open onOpenChange={() => {}}>
      <GlassSheetContent onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <div className="text-center">
          <ShieldAlert className="mx-auto size-10 text-warn-text" aria-hidden />
          <GlassSheetTitle className="mt-3 text-xl font-extrabold">{t.newDeviceTitle}</GlassSheetTitle>
          <GlassSheetDescription className="mt-2 text-sm text-ink-2">{secured ? t.secured : t.newDeviceBody}</GlassSheetDescription>
          {!secured ? (
            <div className="mt-5 space-y-2">
              <GlassButton size="lg" className="w-full" onClick={() => setEdge("none")}>
                <Smartphone className="size-5" aria-hidden /> {t.thisWasMe}
              </GlassButton>
              <GlassButton variant="secondary" size="lg" className="w-full" onClick={() => setSecured(true)}>
                {t.secure}
              </GlassButton>
            </div>
          ) : (
            <GlassButton
              size="lg"
              className="mt-5 w-full"
              onClick={() => {
                setEdge("none");
                logout();
                router.replace("/login");
              }}
            >
              {COPY.session.expiredCta}
            </GlassButton>
          )}
        </div>
      </GlassSheetContent>
    </GlassSheet>
  );
}

const IDLE_MS = 5 * 60 * 1000;
const WARN_SECS = 60;

/** Idle timer: after 5 quiet minutes (or via Demo Controls) shows the "still there?" modal. */
export function IdleTimeout() {
  const t = COPY.session;
  const warn = useStore((s) => s.session.timeoutWarning);
  const setWarn = useStore((s) => s.setTimeoutWarning);
  const setEdge = useStore((s) => s.setEdge);
  const [secs, setSecs] = useState(WARN_SECS);

  useEffect(() => {
    if (warn) return;
    let id = setTimeout(() => setWarn(true), IDLE_MS);
    const reset = () => {
      clearTimeout(id);
      id = setTimeout(() => setWarn(true), IDLE_MS);
    };
    const evs = ["pointerdown", "keydown", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(id);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [warn, setWarn]);

  useEffect(() => {
    if (!warn) return;
    const id = setInterval(() => setSecs((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [warn]);

  useEffect(() => {
    if (warn && secs <= 0) {
      setWarn(false);
      setEdge("session_expired");
    }
  }, [warn, secs, setWarn, setEdge]);

  const stay = () => {
    setWarn(false);
    setSecs(WARN_SECS);
  };

  return (
    <GlassSheet open={warn} onOpenChange={(o) => !o && stay()}>
      <GlassSheetContent>
        <GlassSheetTitle className="text-xl font-extrabold">{t.warnTitle}</GlassSheetTitle>
        <GlassSheetDescription className="mt-2 text-sm text-ink-2" aria-live="polite">
          {t.warnBody(Math.max(0, secs))}
        </GlassSheetDescription>
        <div className="mt-5 space-y-2">
          <GlassButton size="lg" className="w-full" onClick={stay}>
            {t.stay}
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              setWarn(false);
              setEdge("session_expired");
            }}
          >
            {t.leave}
          </GlassButton>
        </div>
      </GlassSheetContent>
    </GlassSheet>
  );
}
