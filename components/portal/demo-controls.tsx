"use client";

import { useEffect } from "react";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import { useEmbedded } from "@/components/demo/use-embedded";
import { DemoWorldControls } from "@/components/demo/demo-world-controls";
import { GlassButton, GlassCard } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { AURA } from "@/lib/copy-aura";
import { loadAuraPreset } from "@/lib/score/use-aura";
import { OPS_ROLES, REJECTION, type PayState, type RejectionReason } from "@/lib/mock-data";
import { useStore, KYC_RETRY_LIMIT, makeRef, useHydrated } from "@/lib/store/store";
import type { AuthEdge, KycStatus, VerificationStatus } from "@/lib/store/types";
import type { AppStatus } from "@/lib/mock-portal";
import { cn } from "@/lib/utils";

export const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_CONTROLS !== "false";

type AuraOption = keyof typeof AURA.demo.presets;

/** Always mounted: rehydrates persisted demo state, and runs the "pending becomes accepted after 8s" auto mode. */
export function PortalRuntime() {
  useHydrated();
  const auto = useStore((s) => s.demo.autoAccept);
  const status = useStore((s) => s.verification.status);
  const submittedAt = useStore((s) => s.verification.submittedAt);
  const setVerification = useStore((s) => s.setVerification);

  useEffect(() => {
    if (!DEMO_ENABLED || !auto || status !== "pending") return;
    const id = setTimeout(() => setVerification("accepted"), 8000);
    return () => clearTimeout(id);
  }, [auto, status, submittedAt, setVerification]);

  return null;
}

function Group<T extends string>({ label, options, value, onPick }: { label: string; options: readonly { id: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[11px] font-bold uppercase tracking-wider text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.id === value}
            onClick={() => onPick(o.id)}
            className={cn("min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors", o.id === value ? "border-transparent bg-accent text-accent-ink" : "border-ink/20 hover:bg-ink/10")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const VERIF: { id: VerificationStatus; label: string }[] = [
  { id: "not_started", label: "Not started" },
  { id: "pending", label: "Pending review" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
  { id: "expired", label: "Expired" },
  { id: "resubmission", label: "Resubmission required" },
];
const KYC: { id: KycStatus; label: string }[] = [
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "provider_error", label: "Provider error" },
  { id: "retry_limit", label: "Retry limit reached" },
  { id: "escalated", label: "Escalated to manual review" },
  { id: "verified", label: "Verified" },
];
const LOAN: { id: AppStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "assessment", label: "Under assessment" },
  { id: "more_info", label: "More info needed" },
  { id: "offer_ready", label: "Offer ready" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
];
const PAY: { id: PayState; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "successful", label: "Successful" },
  { id: "failed", label: "Failed" },
  { id: "reversed", label: "Reversed" },
];
const EDGE: { id: AuthEdge; label: string }[] = [
  { id: "none", label: "Normal" },
  { id: "session_expired", label: "Session expired" },
  { id: "locked", label: "Account locked" },
  { id: "suspicious", label: "Suspicious login" },
];

/** Floating demo panel. Shown everywhere (local and deployed) unless NEXT_PUBLIC_DEMO_CONTROLS=false. */
export function DemoControls() {
  const s = useStore();
  const embedded = useEmbedded();
  // inside a phone frame on the Demo Stage the panel would sit on top of the app; the stage has its own
  if (!DEMO_ENABLED || embedded) return null;
  const d = COPY.demo;

  return (
    <>
      <button
        type="button"
        onClick={() => s.setDemoOpen(!s.demo.open)}
        aria-expanded={s.demo.open}
        aria-controls="demo-panel"
        aria-label={d.open}
        // a small round icon at the right edge (no label), clear of the hero phone, the stage switcher and the dashboard tabs
        className="glass glass-strong print:hidden fixed bottom-[92px] right-3 z-[85] inline-flex size-11 items-center justify-center rounded-full sm:bottom-24 lg:bottom-4"
      >
        <FlaskConical className="size-[18px] text-ink" aria-hidden />
      </button>

      {s.demo.open && (
        <GlassCard
          id="demo-panel"
          role="dialog"
          aria-label={d.title}
          radius="lg"
          strength="strong"
         
          className="fixed bottom-[148px] right-3 z-[85] max-h-[70dvh] w-[min(92vw,380px)] space-y-4 overflow-y-auto p-4 lg:bottom-16"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">{d.title}</h2>
              <p className="text-xs text-ink-2">{d.note}</p>
            </div>
            <button type="button" aria-label="Close demo controls" onClick={() => s.setDemoOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-ink/10">
              <X className="size-4" />
            </button>
          </div>

          <DemoWorldControls />

          <Group
            label="Quick presets"
            value={"" as "fresh"}
            onPick={(v) => s.applyPreset(v)}
            options={[
              { id: "fresh", label: "Fresh visitor" },
              { id: "new_student", label: "Logged in, unverified" },
              { id: "verified", label: "Verified student" },
              { id: "verified_loan", label: "Verified + active loan" },
            ] as const}
          />

          <Group
            label={AURA.demo.group}
            value={(s.aura.preset ?? "auto") as AuraOption}
            onPick={(v) => {
              s.setAuraPreset(v === "auto" ? null : v);
              if (v !== "auto" && v !== "unavailable") void loadAuraPreset(v);
            }}
            options={(Object.keys(AURA.demo.presets) as AuraOption[]).map((id) => ({ id, label: AURA.demo.presets[id] }))}
          />
          <Group label="Verification status" options={VERIF} value={s.verification.status} onPick={(v) => s.setVerification(v, v === "rejected" || v === "resubmission" ? s.verification.reason : null)} />
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" className="size-4" checked={s.demo.autoAccept} onChange={(e) => s.setAutoAccept(e.target.checked)} />
            Auto mode: Pending becomes Accepted after 8 seconds
          </label>
          <Group
            label="Rejection reason"
            options={(Object.keys(REJECTION) as RejectionReason[]).map((k) => ({ id: k, label: REJECTION[k].label }))}
            value={(s.verification.reason ?? "") as RejectionReason}
            onPick={(r) => s.setVerification(s.verification.status === "resubmission" ? "resubmission" : "rejected", r)}
          />
          <Group
            label="KYC status"
            options={KYC}
            value={s.kyc.status}
            onPick={(v) => s.setKyc(v, { retries: v === "retry_limit" || v === "escalated" ? KYC_RETRY_LIMIT : v === "not_started" ? 0 : s.kyc.retries, reference: v === "escalated" || v === "retry_limit" ? s.kyc.reference ?? makeRef("KYC") : s.kyc.reference, maskedId: v === "verified" ? "••••••••4821" : s.kyc.maskedId })}
          />
          <Group label="Loan application status" options={LOAN} value={s.loanApp.status as AppStatus} onPick={(v) => s.setLoanStatus(v)} />
          <Group label="Next repayment outcome" options={PAY} value={s.demo.paymentOutcome} onPick={(v) => s.setPaymentOutcome(v)} />
          <Group label="Auth edge case" options={EDGE} value={s.session.edge} onPick={(v) => s.setEdge(v)} />
          <GlassButton variant="secondary" size="sm" onClick={() => s.setTimeoutWarning(true)}>
            Show session timeout warning
          </GlassButton>
          <Group label="Ops role" options={OPS_ROLES} value={s.ops.role} onPick={(v) => s.setRole(v)} />

          <GlassButton asChild variant="secondary" size="sm" className="w-full">
            <a href="/ops">Open internal ops dashboard (demo)</a>
          </GlassButton>

          <GlassButton variant="outline" size="sm" className="w-full" onClick={() => s.resetAll()}>
            <RotateCcw className="size-4" aria-hidden /> {d.reset}
          </GlassButton>
        </GlassCard>
      )}
    </>
  );
}
