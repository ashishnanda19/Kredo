"use client";

import { useState } from "react";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { REFUND } from "@/lib/copy-demo";
import { refundPayment } from "@/lib/domain/refunds";
import type { Loan } from "@/lib/domain/types";
import { DomainError } from "@/lib/domain/world";
import { getPolicy } from "@/lib/policy";
import { useWorld } from "@/lib/store/world";

/** Refund one whole payment. Says what will happen before the button, and what happens if it needs review. */
export function RefundSheet({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const apply = useWorld((s) => s.apply);
  const vendorId = useWorld((s) => s.session.vendorId);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const threshold = getPolicy().refunds.opsApprovalAboveCoins;

  function close() {
    setReason("");
    setError(null);
    setDone(null);
    onClose();
  }

  function submit() {
    if (!loan || !vendorId) return;
    try {
      const r = refundPayment(useWorld.getState().world, { loanId: loan.id, vendorId, reason, actor: vendorId });
      apply(() => r.world);
      setDone(r.refund.status === "done" ? REFUND.done : REFUND.sent);
      setError(null);
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "That didn't work. Try again.");
    }
  }

  return (
    <GlassSheet open={loan !== null} onOpenChange={(o) => !o && close()}>
      <GlassSheetContent>
        {loan && (done ? (
          <div className="space-y-4 text-center" data-testid="refund-done">
            <GlassSheetTitle className="text-xl font-extrabold">{REFUND.refunded}</GlassSheetTitle>
            <GlassSheetDescription className="text-sm text-ink-2">{done}</GlassSheetDescription>
            <GlassButton className="w-full" onClick={close}>OK</GlassButton>
          </div>
        ) : (
          <div className="space-y-4">
            <GlassSheetTitle className="text-xl font-extrabold">{REFUND.sheetTitle}</GlassSheetTitle>
            <GlassSheetDescription className="text-sm text-ink-2">{loan.coins} coins · {loan.settlementId ? REFUND.post : REFUND.pre}</GlassSheetDescription>
            {loan.coins > threshold && <p className="text-sm font-semibold">{REFUND.needsOps(threshold)}</p>}
            <div>
              <label htmlFor="refund-reason" className="text-sm font-semibold">{REFUND.reason}</label>
              <textarea id="refund-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-[14px] border border-hairline bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30" />
              <p className="mt-1 text-xs text-ink-2">{REFUND.reasonHint}</p>
            </div>
            {error && <p role="alert" className="text-sm font-medium text-bad-text">{error}</p>}
            <div className="flex gap-2">
              <GlassButton variant="outline" className="flex-1" onClick={close}>Cancel</GlassButton>
              <GlassButton className="flex-1" data-testid="refund-confirm" onClick={submit}>{REFUND.confirm}</GlassButton>
            </div>
          </div>
        ))}
      </GlassSheetContent>
    </GlassSheet>
  );
}
