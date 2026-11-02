"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdCard } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassButton, GlassInput } from "@/components/glass";
import { ONB } from "@/lib/copy-demo";
import { getPolicy } from "@/lib/policy";
import { submitKyc } from "@/lib/store/vendor-actions";
import { cn } from "@/lib/utils";
import { STEP_ROUTE, useOnboarding } from "./use-onboarding";
import { WizardFrame } from "./wizard-frame";

const t = ONB.kyc;

export function KycStep() {
  const router = useRouter();
  const { ready, vendorId, vendor } = useOnboarding("kyc");
  const [last4, setLast4] = useState("");
  const [proof, setProof] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const caps = getPolicy().vendor.dailyCapCoins;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(last4)) return setErr(t.idBad);
    if (!vendorId || busy) return;
    setErr(null);
    setBusy(true);
    try {
      const outcome = await submitKyc(vendorId, { idLast4: last4, hasBusinessProof: proof });
      if (outcome === "verified") router.push(STEP_ROUTE.bank);
      else setErr(outcome === "needs_retry" ? t.retry : t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardFrame step="kyc" title={t.title} ready={ready}>
      <form noValidate onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-2">{t.why}</p>
        <Field id="k-id" label={t.idLabel} error={err}>
          <GlassInput id="k-id" inputMode="numeric" maxLength={4} autoComplete="off" value={last4} invalid={!!err} onChange={(e) => { setLast4(e.target.value.replace(/\D/g, "")); setErr(null); }} />
        </Field>
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline p-3 text-sm text-ink-2">
          <IdCard className="size-5 shrink-0" aria-hidden />
          <span><span className="font-semibold text-ink">{t.photo}.</span> {t.photoNote}</span>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t.proofTitle}</legend>
          {[{ v: true, l: t.proofYes }, { v: false, l: t.proofNo }].map((o) => (
            <button key={String(o.v)} type="button" role="radio" aria-checked={proof === o.v} onClick={() => setProof(o.v)} className={cn("flex min-h-12 w-full items-center rounded-2xl border px-4 text-left text-sm font-semibold transition-colors", proof === o.v ? "border-ink bg-card" : "border-hairline hover:bg-card")}>
              {o.l}
            </button>
          ))}
          <p className="text-xs text-ink-2">{t.proofNote}</p>
          <p className="text-xs font-semibold" data-testid="cap-line">{t.cap(proof ? caps.full : caps.light)}</p>
        </fieldset>
        {vendor?.onboarding?.kyc === "verified" && <p className="text-sm font-semibold text-ok-text">{t.done}</p>}
        <GlassButton type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t.checking : t.submit}</GlassButton>
      </form>
    </WizardFrame>
  );
}
