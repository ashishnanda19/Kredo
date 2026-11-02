"use client";

import { useRef, useState } from "react";
import { GlassButton, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { SuccessCheck } from "@/components/shared/success-check";
import { GlassInput } from "@/components/glass";
import { STUDENT } from "@/lib/copy-demo";
import { amountDue } from "@/lib/domain/selectors";
import { fmtDate } from "@/lib/domain/time";
import type { Loan } from "@/lib/domain/types";
import { repay, type RepayOutcome } from "@/lib/store/pay-actions";
import { cn } from "@/lib/utils";

type Mode = "all" | "one" | "part";
const t = STUDENT.repayFlow;

/**
 * Repay one loan (in full or in part) or everything that is due. The payment goes to the lending partner, never to
 * Kredo; the "lender" screen here is a simulated hand-off. Costs and dates are shown before the button.
 */
export function RepaySheetWorld({ open, onOpenChange, loans, focus }: { open: boolean; onOpenChange: (o: boolean) => void; loans: Loan[]; focus?: Loan }) {
  const [mode, setMode] = useState<Mode>(focus ? "one" : "all");
  const [part, setPart] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<"review" | "lender" | "done">("review");
  const [out, setOut] = useState<RepayOutcome | null>(null);
  const key = useRef<string | null>(null);
  const getKey = () => (key.current ??= `repay-${Math.random().toString(36).slice(2)}`);

  const target = mode === "all" || !focus ? loans : [focus];
  const due = target.reduce((s, l) => s + amountDue(l), 0);
  const focusDue = focus ? amountDue(focus) : 0;
  const amount = mode === "part" ? Number(part) || 0 : due;

  function go() {
    if (mode === "part" && (!Number.isInteger(amount) || amount < 1 || amount > focusDue)) return setErr(t.partBad(focusDue));
    setErr(null);
    setPhase("lender");
    setTimeout(() => {
      try {
        const r = repay(target.map((l) => l.id), getKey(), mode === "part" ? amount : undefined);
        setOut(r);
        setPhase("done");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "That didn't work. Try again.");
        setPhase("review");
      }
    }, 1100);
  }

  function change(o: boolean) {
    onOpenChange(o);
    if (!o)
      setTimeout(() => {
        setPhase("review");
        setOut(null);
        setPart("");
        key.current = null;
      }, 250);
  }

  const delta = out?.events.reduce((s, e) => s + (e.scored === false ? 0 : e.delta), 0) ?? 0;
  return (
    <GlassSheet open={open} onOpenChange={change}>
      <GlassSheetContent>
        {phase === "done" && out ? (
          <div className="flex flex-col items-center py-4 text-center" data-testid="repay-done">
            <SuccessCheck />
            <GlassSheetTitle className="mt-5 text-2xl font-extrabold">{t.doneTitle(out.paid)}</GlassSheetTitle>
            <GlassSheetDescription className="mt-1 text-sm text-ink-2">{t.doneBody}</GlassSheetDescription>
            <p data-testid="repay-aura" className="mt-3 text-sm font-semibold">{delta > 0 ? t.auraUp(delta) : delta < 0 ? t.auraDown(-delta) : t.auraNone}</p>
            <GlassButton className="mt-5 w-full" size="lg" onClick={() => change(false)}>{t.close}</GlassButton>
          </div>
        ) : phase === "lender" ? (
          <div role="status" className="py-8 text-center">
            <GlassSheetTitle className="text-xl font-extrabold">{t.lenderTitle}</GlassSheetTitle>
            <GlassSheetDescription className="mt-2 text-sm text-ink-2">{t.lenderBody}</GlassSheetDescription>
          </div>
        ) : (
          <div className="space-y-4">
            <GlassSheetTitle className="text-xl font-extrabold">{t.title}</GlassSheetTitle>
            <GlassSheetDescription className="text-sm text-ink-2">{t.note}</GlassSheetDescription>
            {loans.length === 0 ? (
              <p className="text-sm text-ink-2">{t.nothing}</p>
            ) : (
              <>
                <div role="radiogroup" aria-label="What to repay" className="flex flex-wrap gap-2">
                  {([focus ? ["one", t.one] : null, ["all", t.all(loans.length)], focus ? ["part", t.part] : null].filter(Boolean) as [Mode, string][]).map(([m, l]) => (
                    <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => { setMode(m); setErr(null); }} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold", mode === m ? "border-transparent bg-accent text-accent-ink" : "border-hairline hover:bg-card")}>{l}</button>
                  ))}
                </div>
                {mode === "part" && (
                  <div>
                    <label htmlFor="part-amt" className="text-sm font-semibold">{t.amount}</label>
                    <GlassInput id="part-amt" inputMode="numeric" value={part} invalid={!!err} onChange={(e) => setPart(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                    <p className="mt-1 text-xs text-ink-2">{t.partHelp(focusDue)}</p>
                  </div>
                )}
                <ul className="divide-y divide-hairline rounded-2xl bg-card px-4 text-sm">
                  {target.map((l) => (
                    <li key={l.id} className="flex justify-between gap-3 py-2.5"><span>Due {fmtDate(l.dueDate)}</span><span className="font-semibold tabular-nums">₹{amountDue(l)}</span></li>
                  ))}
                </ul>
                {err && <p role="alert" className="text-sm font-medium text-bad-text">{err}</p>}
                <GlassButton size="lg" className="w-full" data-testid="repay-confirm" onClick={go} disabled={amount <= 0 && mode !== "part"}>{t.pay(amount)}</GlassButton>
              </>
            )}
          </div>
        )}
      </GlassSheetContent>
    </GlassSheet>
  );
}
