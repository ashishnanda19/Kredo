"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Landmark, Loader2, RotateCcw, Smartphone, CreditCard, Undo2 } from "lucide-react";
import { Row } from "@/components/dashboard/sheets";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { Disclosure } from "@/components/shared/demo-tag";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { PAY_STATE_INFO, type PayState } from "@/lib/mock-data";
import { nextInstalment, useStore } from "@/lib/store/store";
import type { Loan } from "@/lib/store/types";
import { cn } from "@/lib/utils";

const T = COPY.loans;
const ICON = { upi: Smartphone, netbanking: Landmark, card: CreditCard } as const;
type Phase = "choose" | "checkout" | "processing" | "result";

const RESULT_ICON: Record<PayState, React.ReactNode> = {
  successful: <CheckCircle2 className="mx-auto size-14 text-ok-text" aria-hidden />,
  pending: <Clock className="mx-auto size-14 text-warn-text" aria-hidden />,
  failed: <AlertTriangle className="mx-auto size-14 text-bad-text" aria-hidden />,
  reversed: <Undo2 className="mx-auto size-14 text-info-text" aria-hidden />,
};

function Body({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const inst = nextInstalment(loan);
  const outcome = useStore((s) => s.demo.paymentOutcome);
  const record = useStore((s) => s.recordPayment);
  const [phase, setPhase] = useState<Phase>("choose");
  const [method, setMethod] = useState<"upi" | "netbanking" | "card">("upi");
  const [result, setResult] = useState<PayState | null>(null);

  if (!inst) return <p className="py-6 text-center text-ink-2">Nothing is due on this loan.</p>;
  const amount = inst.amount;
  const label = T.methods.find((m) => m.id === method)!.label;

  function pay() {
    if (!inst) return;
    setPhase(method === "card" ? "checkout" : "processing");
    if (method !== "card") settle();
  }
  function settle() {
    setPhase("processing");
    setTimeout(() => {
      if (!inst) return;
      const ref = method === "upi" ? "UPI••••" : method === "netbanking" ? "NB••••" : "CARD••••";
      record({ amount, method: method === "upi" ? "UPI" : method === "netbanking" ? "Netbanking" : "Debit card", state: outcome, loanId: loan.id, instalment: inst.n, reconciled: outcome === "successful", ref: `${ref}${String(Math.floor(1000 + Math.random() * 9000))}` }, { loanId: loan.id, n: inst.n });
      setResult(outcome);
      setPhase("result");
    }, 1500);
  }

  return (
    <div aria-live="polite">
      {phase === "choose" && (
        <>
          <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">{T.repayTitle}</GlassSheetTitle>
          <GlassSheetDescription className="mt-1 text-sm text-ink-2">
            {loan.product}, instalment {inst.n} of {loan.tenure}
          </GlassSheetDescription>
          <dl className="mt-4 divide-y divide-ink/10 rounded-[20px] bg-ink/[0.06] px-4">
            <Row label="Due date" value={formatDate(inst.dueDate)} />
            <Row label="Principal" value={formatINR(inst.principal)} />
            <Row label="Interest and charges" value={formatINR(inst.charges)} />
            <Row label="Total to pay" value={formatINR(amount)} strong />
          </dl>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">{T.method}</legend>
            <div role="radiogroup" className="space-y-2">
              {T.methods.map((m) => {
                const Icon = ICON[m.id as keyof typeof ICON];
                return (
                  <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id as typeof method)} className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors", method === m.id ? "border-ink bg-accent-soft" : "border-ink/15 hover:bg-ink/10")}>
                    <Icon className="size-5 text-ink" aria-hidden />
                    <span>
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-xs text-ink-2">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <GlassButton size="lg" className="mt-5 w-full" onClick={pay}>
            {T.pay(formatINR(amount))}
          </GlassButton>
          <p className="mt-3 text-center text-xs text-ink-2">{COPY.legal.nudge}</p>
          <Disclosure className="mt-2 justify-center" />
        </>
      )}

      {phase === "checkout" && (
        <div>
          <GlassSheetTitle className="text-xl font-semibold tracking-[-0.035em]">Secure checkout (mock)</GlassSheetTitle>
          <GlassSheetDescription className="mt-1 text-sm text-ink-2">{T.checkoutNote}</GlassSheetDescription>
          <div className="mt-4 rounded-[20px] bg-ink/[0.06] p-4 text-sm">
            <p className="font-semibold">Mock Payments Ltd</p>
            <p className="mt-1 text-ink-2">
              Paying {formatINR(amount)} to {loan.lender}
            </p>
            <p className="mt-3 font-mono tracking-widest">•••• •••• •••• 0042</p>
          </div>
          <GlassButton size="lg" className="mt-5 w-full" onClick={settle}>
            Confirm payment
          </GlassButton>
        </div>
      )}

      {phase === "processing" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="size-10 animate-spin text-info-text" aria-hidden />
          <GlassSheetTitle className="text-lg font-semibold">{T.paying}</GlassSheetTitle>
          <GlassSheetDescription className="sr-only">Processing your {label} payment</GlassSheetDescription>
        </div>
      )}

      {phase === "result" && result && (
        <div className="text-center">
          {RESULT_ICON[result]}
          <GlassSheetTitle className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{result === "successful" ? "Repaid on time. That's a W." : PAY_STATE_INFO[result].label}</GlassSheetTitle>
          <GlassSheetDescription className="mt-2 text-sm text-ink-2">{result === "successful" ? `${formatINR(amount)} paid. ${PAY_STATE_INFO.successful.why}` : PAY_STATE_INFO[result].why}</GlassSheetDescription>
          <p className="mt-3 rounded-2xl bg-ink/[0.07] px-4 py-3 text-sm">
            <span className="font-semibold">Next: </span>
            {PAY_STATE_INFO[result].next}
          </p>
          <div className="mt-5 space-y-2">
            {result === "failed" && (
              <GlassButton size="lg" className="w-full" onClick={() => setPhase("choose")}>
                <RotateCcw className="size-4" aria-hidden /> {T.again}
              </GlassButton>
            )}
            <GlassButton variant={result === "failed" ? "secondary" : "default"} size="lg" className="w-full" onClick={onClose}>
              {T.close}
            </GlassButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function RepaySheet({ loan, open, onOpenChange }: { loan: Loan | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <GlassSheet open={open} onOpenChange={onOpenChange}>
      <GlassSheetContent>{open && loan && <Body loan={loan} onClose={() => onOpenChange(false)} />}</GlassSheetContent>
    </GlassSheet>
  );
}
