"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/glass";
import { ONB } from "@/lib/copy-demo";
import { getPolicy } from "@/lib/policy";
import { agreeAndSubmit } from "@/lib/store/vendor-actions";
import { STEP_ROUTE, useOnboarding } from "./use-onboarding";
import { WizardFrame } from "./wizard-frame";

const t = ONB.agreement;

export function AgreementStep() {
  const router = useRouter();
  const { ready, vendorId } = useOnboarding("agreement");
  const [agreed, setAgreed] = useState(false);
  const [showNeed, setShowNeed] = useState(false);
  const p = getPolicy();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return setShowNeed(true);
    if (!vendorId) return;
    agreeAndSubmit(vendorId);
    router.push(STEP_ROUTE.status);
  }

  return (
    <WizardFrame step="agreement" title={t.title} ready={ready}>
      <form noValidate onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-2">{t.intro}</p>
        <dl className="space-y-3">
          {t.points(p.settlement.delayHours, p.settlement.vendorFeePercent).map((x) => (
            <div key={x.h}>
              <dt className="text-sm font-bold">{x.h}</dt>
              <dd className="text-sm text-ink-2">{x.b}</dd>
            </div>
          ))}
        </dl>
        <label className="flex min-h-11 items-start gap-3 text-sm font-semibold">
          <input type="checkbox" className="mt-0.5 size-5" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setShowNeed(false); }} />
          {t.agree}
        </label>
        {showNeed && <p role="alert" className="text-sm font-medium text-bad-text">{t.need}</p>}
        <GlassButton type="submit" size="lg" className="w-full">{t.submit}</GlassButton>
      </form>
    </WizardFrame>
  );
}
