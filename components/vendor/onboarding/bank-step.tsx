"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/forms/field";
import { GlassButton, GlassInput } from "@/components/glass";
import { ONB } from "@/lib/copy-demo";
import { isIfsc } from "@/lib/domain/vendors";
import { checkBank } from "@/lib/store/vendor-actions";
import { STEP_ROUTE, useOnboarding } from "./use-onboarding";
import { WizardFrame } from "./wizard-frame";

const t = ONB.bank;

/** Account number and IFSC, then a simulated ₹1 penny-drop. The full account number is never stored. */
export function BankStep() {
  const router = useRouter();
  const { ready, vendorId } = useOnboarding("bank");
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [errs, setErrs] = useState<{ acct?: string; ifsc?: string }>({});
  const [result, setResult] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = acct.replace(/\D/g, "");
    const next: typeof errs = {};
    if (digits.length < 9 || digits.length > 18) next.acct = t.acctBad;
    if (!isIfsc(ifsc)) next.ifsc = t.ifscBad;
    setErrs(next);
    setResult(null);
    if (Object.keys(next).length || !vendorId || busy) return;
    setBusy(true);
    try {
      const r = await checkBank(vendorId, { accountNumber: digits, ifsc });
      if (r.outcome === "success") {
        setResult({ tone: "ok", text: t.success(`•••• ${digits.slice(-4)}`) });
        setAcct(""); // the full number is not kept anywhere
      } else if (r.outcome === "name_mismatch") setResult({ tone: "bad", text: t.mismatch(r.holderName ?? "another name") });
      else setResult({ tone: "bad", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  const verified = result?.tone === "ok";
  return (
    <WizardFrame step="bank" title={t.title} ready={ready}>
      <form noValidate onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-2">{t.why}</p>
        <Field id="b-acct" label={t.acct} error={errs.acct}>
          <GlassInput id="b-acct" inputMode="numeric" autoComplete="off" maxLength={18} value={acct} disabled={verified} invalid={!!errs.acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field id="b-ifsc" label={t.ifsc} error={errs.ifsc}>
          <GlassInput id="b-ifsc" autoCapitalize="characters" autoComplete="off" maxLength={11} value={ifsc} disabled={verified} invalid={!!errs.ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
        </Field>
        <p className="text-xs text-ink-2">{t.demoNote}</p>
        {result && (
          <p role={result.tone === "ok" ? "status" : "alert"} data-testid="bank-result" className={result.tone === "ok" ? "text-sm font-semibold text-ok-text" : "text-sm font-semibold text-bad-text"}>
            {result.text}
          </p>
        )}
        {verified ? (
          <GlassButton type="button" size="lg" className="w-full" onClick={() => router.push(STEP_ROUTE.agreement)}>{t.next}</GlassButton>
        ) : (
          <GlassButton type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t.checking : t.submit}</GlassButton>
        )}
      </form>
    </WizardFrame>
  );
}
