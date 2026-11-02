"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ScanLine } from "lucide-react";
import { GlassButton, GlassCard, GlassInput, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Disclosure } from "@/components/shared/demo-tag";
import { SuccessCheck } from "@/components/shared/success-check";
import { STUDENT } from "@/lib/copy-demo";
import { DEMO_PIN } from "@/lib/demo/constants";
import { quote, termOptions } from "@/lib/domain/pay";
import { availableLimit, blockedReason } from "@/lib/domain/selectors";
import { fmtDate } from "@/lib/domain/time";
import type { Loan } from "@/lib/domain/types";
import { CATEGORIES } from "@/lib/domain/vendors";
import { getPolicy } from "@/lib/policy";
import { checkQr, qrPayload } from "@/lib/qr";
import { NetworkError, precheck, submitPay } from "@/lib/store/pay-actions";
import { useWorld } from "@/lib/store/world";
import { cn } from "@/lib/utils";
import { useWorldStudent } from "./use-student";

const t = STUDENT.pay;
const ICON = { food: "canteen", print: "photocopy", stationery: "stationery", laundry: "laundry", other: "cafe" } as const;
const newKey = () => `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type Phase = "form" | "confirm" | "submitting" | "network" | "done";
interface Declined { code: string; message: string }

/** Scan and pay, backed by the demo world. A stall picker stands in for the camera; the QR is checked as a scan would be. */
export function PayWorld() {
  const { world, studentId } = useWorldStudent();
  const [qr, setQr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [amountText, setAmountText] = useState("");
  const [term, setTerm] = useState(getPolicy().repayment.dueInDaysDefault);
  const [declined, setDeclined] = useState<Declined | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [done, setDone] = useState<Loan | null>(null);
  const key = useRef(newKey());
  const checkPin = useWorld((s) => s.checkPin);

  if (!studentId) return null;
  const scan = qr ? checkQr(world, qr) : null;
  const vendorId = scan?.ok ? scan.vendorId : null;
  const vendor = vendorId ? world.vendors[vendorId] : undefined;
  const amount = Number(amountText) || 0;
  const avail = blockedReason(world, studentId) ? 0 : availableLimit(world, studentId);

  function pickStall(id: string) {
    const v = world.vendors[id];
    setScanning(true);
    setDeclined(null);
    setScanError(null);
    setTimeout(() => {
      setScanning(false);
      const code = qrPayload(id, v.qrVersion);
      const r = checkQr(useWorld.getState().world, code);
      setQr(r.ok ? code : null);
      setScanError(r.ok ? null : r.message);
    }, 500);
  }

  function usePasted() {
    const r = checkQr(world, paste.trim());
    setDeclined(null);
    setQr(r.ok ? paste.trim() : null);
    setScanError(r.ok ? null : r.message);
  }

  function review() {
    setDeclined(null);
    if (!qr || !vendorId) return setScanError(t.pickFirst);
    const r = precheck({ studentId: studentId!, qr, coins: amount });
    if (!r.ok) return setDeclined({ code: r.code, message: r.message });
    key.current = newKey();
    setPin("");
    setPinError(false);
    setPhase("confirm");
  }

  async function pay() {
    if (!qr) return;
    if (!checkPin(pin)) return setPinError(true);
    setPinError(false);
    setPhase("submitting");
    try {
      const r = await submitPay({ studentId: studentId!, qr, coins: amount, termDays: term, idempotencyKey: key.current });
      if (r.ok) {
        setDone(r.loan);
        setPhase("done");
      } else {
        setPhase("form");
        setDeclined({ code: r.code, message: r.message });
      }
    } catch (e) {
      if (e instanceof NetworkError) setPhase("network");
      else throw e;
    }
  }

  function again() {
    setQr(null);
    setAmountText("");
    setDone(null);
    setDeclined(null);
    setPhase("form");
  }

  if (phase === "done" && done) {
    const stall = world.vendors[done.vendorId]?.stallName ?? "the stall";
    return (
      <div className="mx-auto max-w-md pt-6 text-center" data-testid="pay-success">
        <div className="flex justify-center"><SuccessCheck size={104} /></div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em]">{t.successTitle(done.coins)}</h1>
          <p className="mt-1 text-ink-2">{t.successSub(stall)}</p>
          <GlassCard radius="lg" strength="strong" className="mt-6 px-5 text-left">
            <h2 className="pt-3 text-xs font-bold uppercase tracking-wider text-ink-2">{t.receipt}</h2>
            <dl className="divide-y divide-hairline text-sm">
              <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.receiptNo}</dt><dd data-testid="receipt-id">{done.id}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.amount}</dt><dd className="tabular-nums">₹{done.coins}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.fee}</dt><dd className="tabular-nums">₹{done.fee}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.interest}</dt><dd className="tabular-nums">₹{done.interest}</dd></div>
              <div className="flex justify-between py-2.5 font-bold"><dt>{t.rows.total}</dt><dd className="tabular-nums" data-testid="receipt-total">₹{done.totalRepayable}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.due}</dt><dd>{fmtDate(done.dueDate)}</dd></div>
            </dl>
          </GlassCard>
          <p className="mt-3 text-sm text-ink-2">{t.stallNote}</p>
          <div className="mt-6 flex flex-col gap-3">
            <GlassButton asChild size="lg"><Link href={`/dashboard/loans/${done.id}`}>{t.viewLoan}</Link></GlassButton>
            <GlassButton asChild variant="secondary" size="lg"><Link href="/dashboard">{t.home}</Link></GlassButton>
            <GlassButton variant="outline" size="lg" onClick={again}>{t.again}</GlassButton>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = vendorId && amount > 0 ? quote(world, studentId, amount, term) : null;
  const stalls = Object.entries(world.vendors);
  return (
    <div className="mx-auto max-w-xl space-y-6" data-testid="pay-world">
      <div>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{t.sub}</p>
      </div>

      <GlassCard radius="xl" className="grid place-items-center gap-2 p-6 text-center">
        <ScanLine className={cn("size-10", scanning && "animate-pulse")} aria-hidden />
        <p role="status" className="text-sm font-semibold" data-testid="scan-status">{scanning ? t.scanning : vendor ? t.scanned(vendor.stallName) : t.pick}</p>
      </GlassCard>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">{t.pick}</legend>
        <p className="mb-2 text-xs text-ink-2">{t.pickHint}</p>
        <div role="radiogroup" aria-label={t.pick} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stalls.map(([id, v]) => {
            const on = vendorId === id;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} data-testid={`stall-${id}`} onClick={() => pickStall(id)} className={cn("glass glass-soft flex min-h-14 items-center gap-2 rounded-[18px] p-2 text-left transition-[box-shadow,transform] active:scale-[0.97]", on && "!shadow-[0_0_0_2px_var(--ink)]")}>
                <CategoryIcon category={ICON[v.category]} className="size-9 rounded-xl" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{v.stallName}</span>
                  <span className="block truncate text-xs text-ink-2">{CATEGORIES.find((c) => c.value === v.category)?.label} · {v.campusArea}</span>
                </span>
              </button>
            );
          })}
        </div>
        {scanError && <p role="alert" data-testid="scan-error" className="mt-2 text-sm font-medium text-bad-text">{scanError}</p>}
        <details className="mt-2 text-xs text-ink-2">
          <summary className="cursor-pointer font-semibold">{t.paste}</summary>
          <div className="mt-2 flex gap-2">
            <GlassInput aria-label={t.paste} value={paste} onChange={(e) => setPaste(e.target.value)} className="min-h-10 text-sm" />
            <GlassButton size="sm" variant="secondary" onClick={usePasted}>{t.pasteUse}</GlassButton>
          </div>
        </details>
      </fieldset>

      <div>
        <label htmlFor="coins" className="mb-2 block text-sm font-semibold">{t.amount}</label>
        <GlassCard radius="lg" className="flex items-center gap-2 px-5 py-4 focus-within:shadow-[0_0_0_2px_var(--ink)]">
          <input id="coins" inputMode="numeric" autoComplete="off" placeholder="0" value={amountText} aria-describedby="coins-help" onChange={(e) => { setAmountText(e.target.value.replace(/\D/g, "").slice(0, 5)); setDeclined(null); }} className="min-w-0 flex-1 bg-transparent text-4xl font-semibold tabular-nums tracking-[-0.035em] outline-none placeholder:text-ink-2/50" />
          <span className="text-lg font-semibold text-ink-2">coins</span>
        </GlassCard>
        <p id="coins-help" className="mt-2 text-sm text-ink-2" data-testid="avail-help">{t.amountHelp(avail)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {t.presets.map((p) => <GlassButton key={p} variant="secondary" size="sm" onClick={() => { setAmountText(String(p)); setDeclined(null); }}>{p}</GlassButton>)}
        </div>
      </div>

      {declined && (
        <div role="alert" data-testid="declined" className="rounded-2xl border border-bad-text/30 bg-danger-soft p-4 text-sm">
          <p className="font-semibold text-bad-text">{t.declined}</p>
          <p className="mt-1">{declined.message}</p>
          <p className="mt-1 text-xs text-ink-2" data-testid="declined-code">{t.code(declined.code)}</p>
        </div>
      )}

      <div className="space-y-3">
        <GlassButton size="lg" className="w-full" data-testid="review" onClick={review}>{t.review} <ArrowRight className="size-5" aria-hidden /></GlassButton>
        <Disclosure className="justify-center" />
      </div>

      <GlassSheet open={phase === "confirm" || phase === "submitting" || phase === "network"} onOpenChange={(o) => phase === "confirm" && !o && setPhase("form")}>
        <GlassSheetContent>
          {phase === "network" ? (
            <div className="space-y-4" data-testid="network-error">
              <GlassSheetTitle className="text-xl font-extrabold">{t.networkTitle}</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-ink-2">{t.networkBody}</GlassSheetDescription>
              <GlassButton size="lg" className="w-full" data-testid="retry" onClick={pay}>{t.retry}</GlassButton>
            </div>
          ) : (
            <div className="space-y-4">
              <GlassSheetTitle className="text-xl font-extrabold">{t.confirmTitle}</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-ink-2">{t.to(vendor?.stallName ?? "")}</GlassSheetDescription>
              <div role="radiogroup" aria-label={t.rows.term} className="flex flex-wrap gap-2">
                {termOptions().map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={term === d} onClick={() => setTerm(d)} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold", term === d ? "border-transparent bg-accent text-accent-ink" : "border-hairline hover:bg-card")}>{t.termOption(d)}</button>
                ))}
              </div>
              {q && (
                <dl className="divide-y divide-hairline rounded-2xl bg-card px-4 text-sm" data-testid="quote">
                  <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.amount}</dt><dd className="tabular-nums">₹{q.coins}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.fee}</dt><dd className="tabular-nums" data-testid="q-fee">₹{q.fee}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.interest}</dt><dd className="tabular-nums">₹{q.interest}</dd></div>
                  <div className="flex justify-between py-2.5 font-bold"><dt>{t.rows.total}</dt><dd className="tabular-nums" data-testid="q-total">₹{q.total}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.due}</dt><dd data-testid="q-due">{fmtDate(q.dueDate)}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-ink-2">{t.rows.limitAfter}</dt><dd className="tabular-nums" data-testid="q-after">{q.limitAfter} coins</dd></div>
                </dl>
              )}
              <p className="text-xs text-ink-2">{t.consent}</p>
              <div>
                <label htmlFor="pin" className="text-sm font-semibold">{t.pin}</label>
                <GlassInput id="pin" type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} invalid={pinError} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(false); }} />
                {pinError && <p role="alert" className="mt-1 text-sm font-medium text-bad-text">{t.pinWrong}</p>}
                <p className="mt-1 text-xs text-ink-2">{t.pinDemo(DEMO_PIN)}</p>
              </div>
              <GlassButton size="lg" className="w-full" data-testid="pay-confirm" disabled={phase === "submitting" || pin.length < 4} onClick={pay}>{phase === "submitting" ? t.paying : t.payBtn(amount)}</GlassButton>
              <Disclosure className="justify-center" />
            </div>
          )}
        </GlassSheetContent>
      </GlassSheet>
    </div>
  );
}
