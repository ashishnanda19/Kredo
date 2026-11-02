"use client";

import Link from "next/link";
import { CheckCircle2, Hourglass, ShieldAlert, XCircle } from "lucide-react";
import { GlassButton } from "@/components/glass";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { ONB } from "@/lib/copy-demo";
import { fmtDateTime } from "@/lib/domain/time";
import { decideVendor } from "@/lib/domain/vendors";
import { useWorld } from "@/lib/store/world";
import { STEP_ROUTE, useOnboarding } from "./use-onboarding";
import { WizardFrame } from "./wizard-frame";

const t = ONB.status;

export function StatusStep() {
  const { ready, vendorId, vendor } = useOnboarding("status");
  const apply = useWorld((s) => s.apply);
  const o = vendor?.onboarding;
  const s = vendor?.status;

  const view = (() => {
    if (!vendor) return null;
    if (s === "not_started") return { icon: <Hourglass className="size-7" aria-hidden />, title: t.notStarted, body: "", cta: { href: STEP_ROUTE.details, label: ONB.details.save } };
    if (s === "pending") return { icon: <Hourglass className="size-7" aria-hidden />, title: t.pendingTitle, body: t.pendingBody };
    if (s === "accepted") return { icon: <CheckCircle2 className="size-7" aria-hidden />, title: t.acceptedTitle, body: t.acceptedBody, cta: { href: "/vendor", label: t.toDashboard }, cta2: { href: "/vendor/qr", label: t.toQr } };
    if (s === "suspended") return { icon: <ShieldAlert className="size-7" aria-hidden />, title: t.suspendedTitle, body: t.suspendedBody };
    return { icon: <XCircle className="size-7" aria-hidden />, title: s === "resubmission" ? t.resubmitTitle : t.rejectedTitle, body: o?.reason ? t.reason(o.reason) : "", cta: { href: STEP_ROUTE.details, label: t.fix } };
  })();

  return (
    <WizardFrame step="status" title="Verification status" ready={ready}>
      {view && (
        <div className="space-y-4" data-testid="onboarding-status" data-status={s}>
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft">{view.icon}</span>
            <div>
              <h3 className="text-lg font-bold">{view.title}</h3>
              {view.body && <p className="mt-1 text-sm text-ink-2">{view.body}</p>}
            </div>
          </div>
          <ul className="space-y-1 text-sm text-ink-2">
            {o?.submittedAt && <li>{t.timeline.submitted}: {fmtDateTime(o.submittedAt)}</li>}
            {o?.decidedAt && <li>{t.timeline.decided}: {fmtDateTime(o.decidedAt)}</li>}
          </ul>
          {view.cta && <GlassButton asChild size="lg" className="w-full"><Link href={view.cta.href}>{view.cta.label}</Link></GlassButton>}
          {"cta2" in view && view.cta2 && <GlassButton asChild size="lg" variant="outline" className="w-full"><Link href={view.cta2.href}>{view.cta2.label}</Link></GlassButton>}

          {DEMO_ENABLED && s === "pending" && vendorId && (
            <div className="space-y-2 rounded-2xl border border-dashed border-hairline p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{t.demoFast}</p>
              <div className="flex gap-2">
                <GlassButton size="sm" data-testid="fast-accept" onClick={() => apply((w) => decideVendor(w, vendorId, "accept", "demo-director"))}>{t.accept}</GlassButton>
                <GlassButton size="sm" variant="outline" data-testid="fast-reject" onClick={() => apply((w) => decideVendor(w, vendorId, "reject", "demo-director", "The ID photo was unclear. Please resubmit."))}>{t.reject}</GlassButton>
              </div>
            </div>
          )}
        </div>
      )}
    </WizardFrame>
  );
}
