"use client";

import { useState } from "react";
import { GlassButton, GlassFieldError, GlassInput, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { DEMO_PIN } from "@/lib/demo/constants";
import { ROLES } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";

/** Asks for the PIN before switching accounts when the last confirmation is older than the policy allows. */
export function ReauthSheet({ open, onCancel, onConfirmed }: { open: boolean; onCancel: () => void; onConfirmed: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const check = useWorld((s) => s.checkPin);
  const confirm = useWorld((s) => s.confirmSession);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!check(pin)) return setError(true);
    confirm();
    setPin("");
    setError(false);
    onConfirmed();
  }

  return (
    <GlassSheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <GlassSheetContent>
        <form onSubmit={submit} className="space-y-4">
          <GlassSheetTitle className="text-xl font-extrabold">{ROLES.reauthTitle}</GlassSheetTitle>
          <GlassSheetDescription className="text-sm text-ink-2">{ROLES.reauthBody}</GlassSheetDescription>
          <div>
            <GlassInput
              aria-label="PIN"
              inputMode="numeric"
              type="password"
              autoComplete="off"
              maxLength={6}
              value={pin}
              invalid={error}
              aria-describedby="reauth-error"
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError(false);
              }}
            />
            <GlassFieldError id="reauth-error">{error ? ROLES.reauthWrong : undefined}</GlassFieldError>
            <p className="mt-2 text-xs text-ink-2">{ROLES.reauthDemoHint(DEMO_PIN)}</p>
          </div>
          <div className="flex gap-2">
            <GlassButton type="button" variant="outline" className="flex-1" onClick={onCancel}>{ROLES.reauthCancel}</GlassButton>
            <GlassButton type="submit" className="flex-1" disabled={pin.length < 4}>{ROLES.reauthConfirm}</GlassButton>
          </div>
        </form>
      </GlassSheetContent>
    </GlassSheet>
  );
}
