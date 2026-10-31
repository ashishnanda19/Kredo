"use client";

import { useState } from "react";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { Switch } from "@/components/ui/switch";
import { COPY } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { CONSENT_PURPOSES, type ConsentId } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";

/** Purpose-specific consents, each separate, each with its one-line purpose, date and notice version. */
export function ConsentToggles() {
  const consents = useStore((s) => s.consents);
  const grant = useStore((s) => s.grantConsent);
  const withdraw = useStore((s) => s.withdrawConsent);
  const setVerification = useStore((s) => s.setVerification);
  const setKyc = useStore((s) => s.setKyc);
  const addRequest = useStore((s) => s.addRequest);
  const [pending, setPending] = useState<ConsentId | null>(null);

  function confirmWithdraw() {
    if (!pending) return;
    withdraw(pending);
    addRequest("withdrawal", `Consent withdrawn: ${pending}`);
    if (pending === "identity") {
      setVerification("expired");
      setKyc("not_started", { retries: 0, reference: null, maskedId: null });
    }
    setPending(null);
  }

  return (
    <>
      <ul className="divide-y divide-ink/10">
        {CONSENT_PURPOSES.map((c) => {
          const r = consents[c.id];
          const on = !!r?.granted;
          return (
            <li key={c.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <label htmlFor={`consent-${c.id}`} className="block cursor-pointer text-[15px] font-bold">
                  {c.title} {c.required && <span className="ml-1 text-xs font-semibold text-ink-2">(needed to continue)</span>}
                </label>
                <p className="mt-0.5 text-sm text-ink-2">{c.purpose}</p>
                {r && (
                  <p className="mt-1 text-xs text-ink-2">
                    {r.granted ? "Given" : "Withdrawn"} on {formatDate(r.at)} · notice {r.version}
                  </p>
                )}
              </div>
              <Switch id={`consent-${c.id}`} checked={on} onCheckedChange={(v) => (v ? grant(c.id) : setPending(c.id))} aria-label={`${c.title} consent`} />
            </li>
          );
        })}
      </ul>

      <GlassSheet open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <GlassSheetContent>
          <GlassSheetTitle className="text-xl font-extrabold">Withdraw this consent?</GlassSheetTitle>
          <GlassSheetDescription className="mt-2 text-sm text-ink-2">{pending && COPY.privacy.withdrawWarn[pending]}</GlassSheetDescription>
          <div className="mt-5 space-y-2">
            <GlassButton variant="warning" size="lg" className="w-full" onClick={confirmWithdraw}>
              {COPY.privacy.confirmWithdraw}
            </GlassButton>
            <GlassButton variant="secondary" size="lg" className="w-full" onClick={() => setPending(null)}>
              Keep it
            </GlassButton>
          </div>
        </GlassSheetContent>
      </GlassSheet>
    </>
  );
}
