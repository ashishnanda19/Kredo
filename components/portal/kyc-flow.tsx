"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, CheckCircle2, Circle, Loader2, ScanFace, ShieldCheck } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassButton, GlassCard, GlassInput, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { useHydrated, useStore, KYC_RETRY_LIMIT, makeRef } from "@/lib/store/store";
import { VERSIONS } from "@/lib/mock-data";
import { DEMO_ENABLED } from "./demo-controls";
import { ConsentToggles } from "./consent-toggles";
import { MaskedValue, ReferenceNumber } from "./mask";
import { PortalShell } from "./page-shell";
import { StatusPill } from "./status-chip";

const T = COPY.kyc;
type Phase = "redirect" | "id" | "selfie" | "result";

function ProviderBody({ onClose }: { onClose: () => void }) {
  const setKyc = useStore((s) => s.setKyc);
  const [phase, setPhase] = useState<Phase>("redirect");
  const [idv, setIdv] = useState("");
  const [idErr, setIdErr] = useState<string | null>(null);
  // a previous provider error means the next attempt is simulated to fail (set via Demo Controls)
  const [fail, setFail] = useState(() => useStore.getState().kyc.status === "provider_error");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setKyc("in_progress");
    const id = setTimeout(() => setPhase("id"), 1400);
    return () => clearTimeout(id);
  }, [setKyc]);

  function toSelfie() {
    if (!/^\d{12}$/.test(idv)) {
      setIdErr("Enter 12 digits. Please use made-up numbers.");
      return;
    }
    setIdErr(null);
    setPhase("selfie");
  }

  function finish() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setPhase("result");
      if (fail) {
        const retries = useStore.getState().kyc.retries + 1;
        setOk(false);
        if (retries >= KYC_RETRY_LIMIT) setKyc("escalated", { retries, reference: makeRef("KYC") });
        else setKyc("provider_error", { retries });
      } else {
        setOk(true);
        // Only the masked value is ever kept. The number typed above is discarded here.
        setKyc("verified", { maskedId: `••••••••${idv.slice(-4)}` });
        setIdv("");
      }
    }, 1500);
  }

  return (
    <>
        <GlassSheetTitle className="text-xl font-extrabold">{T.modalTitle}</GlassSheetTitle>
        <GlassSheetDescription className="mt-1 text-sm text-ink-2">{T.modalIntro}</GlassSheetDescription>

        <ol className="mt-4 flex gap-1.5" aria-label="Provider steps">
          {(["redirect", "id", "selfie", "result"] as Phase[]).map((p, i) => (
            <li key={p} aria-current={p === phase ? "step" : undefined} className={`h-1.5 flex-1 rounded-full ${i <= (["redirect", "id", "selfie", "result"] as Phase[]).indexOf(phase) ? "bg-pill text-pill-fg" : "bg-ink/15"}`} />
          ))}
        </ol>

        <div className="mt-5" aria-live="polite">
          {phase === "redirect" && (
            <div className="flex items-center gap-3 py-6">
              <Loader2 className="size-6 animate-spin text-info-text" aria-hidden />
              <p className="font-semibold">{T.redirecting}</p>
            </div>
          )}
          {phase === "id" && (
            <div className="space-y-4">
              <Field id="provider-id" label={T.idStep} hint={T.idHint} error={idErr}>
                <GlassInput id="provider-id" inputMode="numeric" autoComplete="off" maxLength={12} value={idv} onChange={(e) => setIdv(e.target.value.replace(/\D/g, ""))} invalid={!!idErr} aria-describedby="provider-id-msg provider-id-err" />
              </Field>
              <GlassButton size="lg" className="w-full" onClick={toSelfie}>
                Continue
              </GlassButton>
            </div>
          )}
          {phase === "selfie" && (
            <div className="space-y-4 text-center">
              <span className="mx-auto grid size-20 place-items-center rounded-full bg-accent-soft text-ink">
                <ScanFace className="size-10" aria-hidden />
              </span>
              <h3 className="font-bold">{T.selfieStep}</h3>
              <p className="text-sm text-ink-2">{T.selfieBody}</p>
              {DEMO_ENABLED && (
                <label className="flex items-center justify-center gap-2 text-xs font-semibold">
                  <input type="checkbox" className="size-4" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Demo: make this attempt fail
                </label>
              )}
              <GlassButton size="lg" className="w-full" onClick={finish} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden /> Checking…
                  </>
                ) : (
                  "Finish check"
                )}
              </GlassButton>
            </div>
          )}
          {phase === "result" && (
            <div className="space-y-3 text-center">
              {ok ? <BadgeCheck className="mx-auto size-14 text-ok-text" aria-hidden /> : <AlertTriangle className="mx-auto size-14 text-bad-text" aria-hidden />}
              <h3 className="text-lg font-bold">{ok ? T.verifiedTitle : T.providerError}</h3>
              <GlassButton size="lg" className="w-full" onClick={onClose}>
                Close
              </GlassButton>
            </div>
          )}
        </div>
    </>
  );
}

function ProviderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <GlassSheet open={open} onOpenChange={(o) => !o && onClose()}>
      <GlassSheetContent>{open && <ProviderBody onClose={onClose} />}</GlassSheetContent>
    </GlassSheet>
  );
}

export function KycFlow() {
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const kyc = useStore((s) => s.kyc);
  const identity = useStore((s) => s.consents.identity);
  const verified = useStore((s) => s.verification.status === "accepted");
  const [open, setOpen] = useState(false);
  const [needConsent, setNeedConsent] = useState(false);

  useEffect(() => {
    if (hydrated && !loggedIn) router.replace("/login?next=/verify/kyc");
  }, [hydrated, loggedIn, router]);

  if (!hydrated || !loggedIn) return <PortalShell width="max-w-xl"><div role="status" className="py-16 text-center text-ink-2">{COPY.gate.loading}</div></PortalShell>;

  const left = Math.max(0, KYC_RETRY_LIMIT - kyc.retries);
  const stepsDone = kyc.status === "verified" ? 4 : kyc.status === "in_progress" ? 1 : identity?.granted ? 1 : 0;

  function start() {
    if (!identity?.granted) {
      setNeedConsent(true);
      return;
    }
    setNeedConsent(false);
    setOpen(true);
  }

  const manual = kyc.status === "escalated" || kyc.status === "retry_limit";

  return (
    <PortalShell width="max-w-xl" back={{ href: "/dashboard", label: "Dashboard" }}>
      <h1 className="text-3xl font-extrabold tracking-tight">{T.title}</h1>
      <p className="mt-2 text-ink-2">{T.sub}</p>
      {!verified && (
        <p className="mt-3 rounded-2xl bg-ink/[0.07] px-4 py-3 text-sm">
          Student verification is the first step. You can do both in parallel.{" "}
          <Link href="/verify/status" className="font-bold text-info-text">
            See status
          </Link>
        </p>
      )}

      <section aria-label={T.consentTitle} className="mt-6">
        <h2 className="text-base font-bold">{T.consentTitle}</h2>
        <p className="mb-1 text-sm text-ink-2">{T.consentSub}</p>
        <ConsentToggles />
        <div className="mt-3 rounded-[20px] border border-ink/15 p-4 text-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-4 text-info-text" aria-hidden /> {T.noticeTitle}
          </h3>
          <p className="mt-1 text-ink-2">{COPY.verify.review.notice}</p>
          <Link href="/legal/privacy" target="_blank" className="mt-2 inline-block font-bold text-info-text">
            Read the notice (version {VERSIONS.privacy})
          </Link>
        </div>
      </section>

      <GlassCard radius="lg" strength="soft" className="mt-6 p-5" role="region" aria-label={T.statusTitle}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{T.statusTitle}</h2>
          <StatusPill kind="kyc" value={kyc.status} />
        </div>

        <ol className="mt-4 space-y-2 text-sm" aria-label={T.outstanding}>
          {T.steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              {i < stepsDone ? <CheckCircle2 className="size-4 text-ok-text" aria-hidden /> : <Circle className="size-4 text-ink-2" aria-hidden />}
              <span className={i < stepsDone ? "" : "text-ink-2"}>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4" aria-live="polite">
          {kyc.status === "verified" && (
            <p className="text-sm">
              {T.verifiedBody} <MaskedValue value={kyc.maskedId ?? "••••••••0000"} label="Identity number" />
            </p>
          )}
          {kyc.status === "provider_error" && (
            <div role="alert" className="space-y-3">
              <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm">{T.providerError}</p>
              <p className="text-xs font-semibold text-ink-2">{T.retriesLeft(left)}</p>
              <GlassButton size="lg" className="w-full" onClick={start}>
                {T.retry}
              </GlassButton>
            </div>
          )}
          {manual && (
            <div role="status" className="space-y-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm">
              <p className="font-bold">{T.manualTitle}</p>
              <p>{T.manualBody(kyc.reference ?? "KYC-2026-000000")}</p>
              <ReferenceNumber value={kyc.reference ?? "KYC-2026-000000"} />
              <GlassButton asChild variant="secondary" size="sm">
                <Link href="/dashboard/support">{COPY.status.contact}</Link>
              </GlassButton>
            </div>
          )}
          {(kyc.status === "not_started" || kyc.status === "in_progress") && (
            <div className="space-y-2">
              <GlassButton size="lg" className="w-full" onClick={start}>
                {kyc.status === "in_progress" ? T.resume : T.start}
              </GlassButton>
              {needConsent && (
                <p role="alert" className="text-sm font-medium text-bad-text">
                  {T.needConsent}
                </p>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      <p className="mt-5 text-center text-sm">
        <Link href="/dashboard/profile/privacy" className="font-bold text-info-text">
          {COPY.privacy.title}
        </Link>
      </p>

      <ProviderModal open={open} onClose={() => setOpen(false)} />
    </PortalShell>
  );
}
