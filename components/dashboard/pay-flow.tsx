"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GlassButton, GlassCard, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Disclosure } from "@/components/shared/demo-tag";
import { SuccessCheck } from "@/components/shared/success-check";
import { COPY } from "@/lib/copy";
import { PRICING } from "@/lib/config";
import { addDays, formatDateLong, formatINR, MOCK_TODAY } from "@/lib/format";
import { available, CATEGORY_LABEL, vendors, type Vendor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { PageHeader } from "./header";
import { QrFrame } from "./qr-frame";
import { Row } from "./sheets";

const QUICK = [50, 100, 200, 500];

export function PayFlow() {
  const t = COPY.pay;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [scanning, setScanning] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [touched, setTouched] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");

  const amount = Number(amountText) || 0;
  const fee = PRICING.platformFee;
  const total = amount + fee;
  const dueDate = addDays(MOCK_TODAY, PRICING.dueInDays);

  const amountError = !touched ? null : amount <= 0 ? t.enterAmount : total > available ? t.tooMuch(formatINR(available)) : null;
  const vendorError = touched && !vendor ? t.pickVendor : null;

  function scan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setVendor(vendors[0]);
    }, 1400);
  }

  function review() {
    setTouched(true);
    if (!vendor || amount <= 0 || total > available) return;
    setSheet(true);
  }

  function confirm() {
    setPhase("processing");
    setTimeout(() => {
      setSheet(false);
      setPhase("success");
    }, 1300);
  }

  function reset() {
    setVendor(null);
    setAmountText("");
    setTouched(false);
    setPhase("form");
  }

  if (phase === "success" && vendor) {
    return (
      <div className="mx-auto max-w-md pt-6 text-center">
        <div className="flex justify-center">
          <SuccessCheck size={104} />
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{t.successTitle(formatINR(amount))}</h1>
          <p className="mt-1 text-muted">to {vendor.name}</p>

          <GlassCard radius="lg" strength="strong" glow="violet" className="mt-6 px-5 text-left">
            <dl className="divide-y divide-foreground/10">
              <Row label={t.rows.amount} value={formatINR(amount)} />
              <Row label={t.rows.fee} value={formatINR(fee)} />
              <Row label={t.rows.total} value={formatINR(total)} strong />
              <Row label={t.rows.dueBy} value={formatDateLong(dueDate)} />
            </dl>
          </GlassCard>
          <p className="mt-3 text-sm text-muted">{t.successBody}</p>

          <div className="mt-6 flex flex-col gap-3">
            <GlassButton asChild size="lg">
              <Link href="/dashboard">{t.home}</Link>
            </GlassButton>
            <GlassButton variant="secondary" size="lg" onClick={reset}>
              {t.again}
            </GlassButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t.title} subtitle={t.sub} />

      <div className="space-y-6">
        <QrFrame scanning={scanning} scanned={vendor?.name} onScan={scan} />

        <fieldset>
          <legend className="mb-2 text-sm font-bold">{t.vendor}</legend>
          <div role="radiogroup" aria-label={t.vendor} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {vendors.slice(0, 6).map((v) => {
              const on = vendor?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setVendor(v)}
                  className={cn(
                    "glass glass-soft flex min-h-14 items-center gap-2 rounded-[18px] p-2 text-left transition-[box-shadow,transform] active:scale-[0.97]",
                    on && "glass-glow-violet !shadow-[0_0_0_2px_var(--neon-violet),0_0_28px_-4px_var(--glow)]",
                  )}
                >
                  <CategoryIcon category={v.category} className="size-9 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{v.name}</span>
                    <span className="block truncate text-xs text-muted">{CATEGORY_LABEL[v.category]}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {vendorError && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-danger">
              {vendorError}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="amount" className="mb-2 block text-sm font-bold">
            {t.amount}
          </label>
          <GlassCard radius="lg" className={cn("flex items-center gap-2 px-5 py-4 transition-shadow focus-within:shadow-[0_0_0_2px_var(--neon-violet),0_0_30px_-4px_var(--glow)]", amountError && "!shadow-[0_0_0_2px_var(--danger)]")}>
            <span className="text-3xl font-extrabold text-muted">₹</span>
            <input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amountText}
              aria-invalid={!!amountError}
              aria-describedby="amount-help"
              onChange={(e) => setAmountText(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="min-w-0 flex-1 bg-transparent text-4xl font-extrabold tabular-nums outline-none placeholder:text-muted/50 focus-visible:shadow-none"
            />
          </GlassCard>
          <div id="amount-help" className="mt-2 text-sm">
            <span className={amountError ? "font-medium text-danger" : "text-muted"} role={amountError ? "alert" : undefined}>
              {amountError ?? `Available: ${formatINR(available)}`}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <GlassButton key={q} variant="secondary" size="sm" onClick={() => setAmountText(String(q))}>
                {formatINR(q)}
              </GlassButton>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <GlassButton size="lg" className="w-full" onClick={review}>
            {t.review} <ArrowRight className="size-5" aria-hidden />
          </GlassButton>
          <p className="text-center text-sm font-semibold">{COPY.legal.nudge}</p>
          <Disclosure className="justify-center" />
        </div>
      </div>

      {/* glass bottom sheet with a plain, clear breakdown (no slang near money) */}
      <GlassSheet open={sheet} onOpenChange={(o) => phase !== "processing" && setSheet(o)}>
        <GlassSheetContent>
          <GlassSheetTitle className="text-xl font-extrabold">{t.sheetTitle}</GlassSheetTitle>
          <GlassSheetDescription className="mt-1 text-sm text-muted">{t.sheetBody}</GlassSheetDescription>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-foreground/[0.07] p-3">
            {vendor && <CategoryIcon category={vendor.category} />}
            <div>
              <p className="font-bold">{vendor?.name}</p>
              <p className="text-sm text-muted">{vendor && CATEGORY_LABEL[vendor.category]}</p>
            </div>
          </div>

          <dl className="mt-3 divide-y divide-foreground/10 rounded-[20px] bg-foreground/[0.05] px-4">
            <Row label={t.rows.amount} value={formatINR(amount)} />
            <Row label={t.rows.fee} value={formatINR(fee)} tip={t.rows.feeTip} />
            <Row label={t.rows.total} value={formatINR(total)} strong tip={t.rows.totalTip} />
            <Row label={t.rows.dueBy} value={formatDateLong(dueDate)} tip={t.rows.dueTip} />
          </dl>

          <GlassButton size="lg" className="mt-5 w-full" onClick={confirm} disabled={phase === "processing"}>
            {phase === "processing" ? t.paying : t.confirm(formatINR(amount))}
          </GlassButton>
          <p className="mt-3 text-center text-xs text-muted">{COPY.legal.nudge}</p>
          <Disclosure className="mt-2 justify-center" />
        </GlassSheetContent>
      </GlassSheet>
    </div>
  );
}
