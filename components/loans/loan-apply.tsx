"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, CircleDashed, Hourglass, Loader2, Lock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/header";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard, GlassInput } from "@/components/glass";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { ReferenceNumber } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { Slider } from "@/components/ui/slider";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { buildOffer, DECLINE_REASONS, EXTRA_INFO_REQUEST, LOAN_PRODUCTS, type AppStatus } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { unmetConditions } from "./eligibility";
import { OfferView } from "./offer-view";

const T = COPY.loan;

const infoSchema = z.object({
  range: z.string().min(1, "Choose a range."),
  source: z.string().min(1, "Choose a source."),
  obligations: z.string().min(1, "Choose one."),
  reference: z.string().trim().max(60, "Keep it under 60 characters.").optional(),
});
type Info = z.infer<typeof infoSchema>;

const STAGES: AppStatus[] = ["submitted", "assessment", "offer_ready", "accepted"];

function Tracker({ status }: { status: AppStatus }) {
  const stages: AppStatus[] = status === "more_info" ? ["submitted", "assessment", "more_info", "offer_ready", "accepted"] : status === "declined" ? ["submitted", "assessment", "declined"] : STAGES;
  const idx = stages.indexOf(status);
  const next = useStore((s) => s.setLoanStatus);
  const order: AppStatus[] = ["submitted", "assessment", "more_info", "offer_ready", "accepted"];
  return (
    <GlassCard radius="lg" className="p-4" role="region" aria-label={T.statusTitle}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{T.statusTitle}</h2>
        <StatusPill kind="loanApp" value={status} />
      </div>
      <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {stages.map((s, i) => (
          <li key={s} aria-current={s === status ? "step" : undefined} className={cn("flex items-center gap-1.5", i <= idx ? "font-bold" : "text-ink-2")}>
            {i < idx ? <CheckCircle2 className="size-4 text-ok-text" aria-hidden /> : s === status ? (status === "declined" ? <XCircle className="size-4 text-bad-text" aria-hidden /> : <Hourglass className="size-4 text-ink" aria-hidden />) : <CircleDashed className="size-4" aria-hidden />}
            {T.statuses[s as keyof typeof T.statuses].t}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-ink-2">{T.statuses[status as keyof typeof T.statuses]?.d}</p>
      {DEMO_ENABLED && status !== "accepted" && status !== "declined" && (
        <GlassButton variant="outline" size="sm" className="mt-3" onClick={() => next(order[Math.min(order.indexOf(status) + 1, order.length - 1)] ?? "assessment")}>
          Demo: move to the next stage
        </GlassButton>
      )}
    </GlassCard>
  );
}

export function LoanApply() {
  const router = useRouter();
  const loanApp = useStore((s) => s.loanApp);
  const verified = useStore((s) => s.verification.status === "accepted");
  const kycOk = useStore((s) => s.kyc.status === "verified");
  const creditConsent = useStore((s) => s.consents.credit?.granted);
  const grant = useStore((s) => s.grantConsent);
  const setDraft = useStore((s) => s.setLoanDraft);
  const submit = useStore((s) => s.submitApplication);
  const setStatus = useStore((s) => s.setLoanStatus);
  const replyMore = useStore((s) => s.replyMoreInfo);
  const accept = useStore((s) => s.acceptOffer);
  const reset = useStore((s) => s.resetApplication);

  const [step, setStep] = useState(1);
  const [amountText, setAmountText] = useState(String(loanApp.amount));
  const [amountErr, setAmountErr] = useState<string | null>(null);
  const [consent, setConsent] = useState(!!creditConsent);
  const [consentErr, setConsentErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [replyErr, setReplyErr] = useState<string | null>(null);

  const status = loanApp.status;
  const product = LOAN_PRODUCTS.find((p) => p.id === loanApp.productId) ?? null;
  const ctx = { verified, kyc: kycOk };

  const form = useForm<Info>({ resolver: zodResolver(infoSchema), defaultValues: { ...loanApp.info } });
  const { errors } = form.formState;

  const min = Math.max(1000, product?.min ?? 1000);
  const max = Math.min(10000, product?.max ?? 10000);

  function chooseProduct(id: string) {
    const p = LOAN_PRODUCTS.find((x) => x.id === id)!;
    const amount = Math.min(Math.max(loanApp.amount, p.min), p.max);
    const tenure = p.tenures.includes(loanApp.tenure) ? loanApp.tenure : p.tenures[0];
    setDraft({ productId: id, amount, tenure, status: "draft" });
    setAmountText(String(amount));
    setStep(2);
  }
  function setAmount(n: number) {
    setDraft({ amount: n });
    setAmountText(String(n));
    setAmountErr(null);
  }
  function amountNext() {
    const n = Number(amountText);
    if (!Number.isFinite(n) || n % 500 !== 0) return setAmountErr("Enter a multiple of ₹500.");
    if (n < min || n > max) return setAmountErr(`This product allows ${formatINR(min)} to ${formatINR(max)}.`);
    setDraft({ amount: n });
    setStep(3);
  }
  function infoNext(v: Info) {
    setDraft({ info: { range: v.range, source: v.source, obligations: v.obligations, reference: v.reference ?? "" } });
    setStep(4);
  }
  function send() {
    if (!consent) return setConsentErr(T.needCredit);
    setBusy(true);
    setTimeout(() => {
      grant("credit");
      submit();
      setBusy(false);
    }, 900);
  }
  function sendReply() {
    if (reply.trim().length < 5) return setReplyErr("Write a short reply (at least 5 characters).");
    replyMore(reply.trim());
    setReply("");
  }

  const offer = loanApp.offer ?? (product ? buildOffer(product, loanApp.amount, loanApp.tenure) : null);
  const back = step > 1 && (status === "none" || status === "draft") && (
    <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden /> Back
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={T.applyTitle} subtitle={T.applySub} />

      <div className="space-y-4">
        {status !== "none" && status !== "draft" && <Tracker status={status} />}

        {(status === "none" || status === "draft") && (
          <GlassCard radius="xl" strength="strong" className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between text-xs font-bold text-ink-2">
              <span>Step {step} of 4</span>
              <span>{["Product", "Amount", "About you", "Review"][step - 1]}</span>
            </div>
            {back}

            {step === 1 && (
              <section aria-label={T.productsTitle} className="space-y-3">
                <h2 className="text-xl font-extrabold">{T.productsTitle}</h2>
                {LOAN_PRODUCTS.map((p) => {
                  const unmet = unmetConditions(p, ctx);
                  const ok = unmet.length === 0;
                  return (
                    <div key={p.id} className={cn("rounded-[22px] border p-4", ok ? "border-ink/50 bg-ink/[0.06]" : "border-ink/15 bg-ink/[0.03]")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{p.name}</h3>
                          <p className="text-sm text-ink-2">{p.tagline}</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatINR(p.min)} to {formatINR(p.max)} · {p.tenures.join(" / ")} months
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", ok ? "bg-success-soft text-ok-text" : "bg-ink/10 text-ink-2")}>{ok ? T.eligible : T.notEligible}</span>
                      </div>
                      <ul className="mt-3 space-y-1 text-xs">
                        {p.conditions.map((c) => (
                          <li key={c.id} className={cn("flex items-center gap-1.5", unmet.includes(c.label) ? "font-semibold text-warn-text" : "text-ink-2")}>
                            {unmet.includes(c.label) ? <Lock className="size-3.5" aria-hidden /> : <CheckCircle2 className="size-3.5 text-ok-text" aria-hidden />}
                            {unmet.includes(c.label) ? `${T.unmet} ${c.label}` : c.label}
                          </li>
                        ))}
                      </ul>
                      <GlassButton size="sm" className="mt-3" disabled={!ok} onClick={() => chooseProduct(p.id)} aria-label={`${T.choose} ${p.name}`}>
                        {T.choose}
                      </GlassButton>
                    </div>
                  );
                })}
              </section>
            )}

            {step === 2 && product && (
              <section aria-label={T.amountTitle} className="space-y-5">
                <h2 className="text-xl font-extrabold">{T.amountTitle}</h2>
                <Field id="amount" label={T.amountLabel} hint={T.amountNote} error={amountErr}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-ink-2">₹</span>
                    <GlassInput id="amount" type="number" inputMode="numeric" min={min} max={max} step={500} value={amountText} onChange={(e) => { setAmountText(e.target.value); setAmountErr(null); }} invalid={!!amountErr} aria-describedby="amount-msg amount-err" className="text-xl font-bold tabular-nums" />
                  </div>
                </Field>
                <Slider min={min} max={max} step={500} value={[Math.min(max, Math.max(min, Number(amountText) || min))]} onValueChange={(v) => setAmount(v[0])} aria-label="Loan amount" />
                <div className="flex justify-between text-xs text-ink-2" aria-hidden>
                  <span>{formatINR(min)}</span>
                  <span>{formatINR(max)}</span>
                </div>
                <fieldset>
                  <legend className="mb-2 text-sm font-bold">{T.tenureTitle}</legend>
                  <div role="radiogroup" className="flex flex-wrap gap-2">
                    {product.tenures.map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={loanApp.tenure === n} onClick={() => setDraft({ tenure: n })} className={cn("min-h-11 rounded-full border px-4 text-sm font-bold", loanApp.tenure === n ? "border-transparent bg-accent text-accent-ink" : "border-ink/20 hover:bg-ink/10")}>
                        {T.tenureLabel(n)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className="text-sm font-semibold">{COPY.legal.nudge}</p>
                <GlassButton size="lg" className="w-full" onClick={amountNext}>
                  Continue
                </GlassButton>
              </section>
            )}

            {step === 3 && (
              <form onSubmit={form.handleSubmit(infoNext)} noValidate aria-label={T.infoTitle} className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold">{T.infoTitle}</h2>
                  <p className="text-sm text-ink-2">{T.infoSub}</p>
                </div>
                <Field id="range" label={T.range.label} why={T.range.why} error={errors.range?.message}>
                  <GlassSelect id="range" invalid={!!errors.range} aria-describedby="range-msg range-err" {...form.register("range")}>
                    <option value="">Choose</option>
                    {["Under ₹3,000", "₹3,000 to 6,000", "₹6,000 to 10,000", "Over ₹10,000"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </GlassSelect>
                </Field>
                <Field id="source" label={T.source.label} why={T.source.why} error={errors.source?.message}>
                  <GlassSelect id="source" invalid={!!errors.source} aria-describedby="source-msg source-err" {...form.register("source")}>
                    <option value="">Choose</option>
                    {["Pocket money from family", "Part-time work", "Scholarship or stipend", "Other"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </GlassSelect>
                </Field>
                <Field id="obligations" label={T.obligations.label} why={T.obligations.why} error={errors.obligations?.message}>
                  <GlassSelect id="obligations" invalid={!!errors.obligations} aria-describedby="obligations-msg obligations-err" {...form.register("obligations")}>
                    <option value="">Choose</option>
                    {["None", "Under ₹1,000 a month", "₹1,000 to 3,000 a month", "Over ₹3,000 a month"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </GlassSelect>
                </Field>
                <Field id="reference" label={T.reference.label} why={T.reference.why} error={errors.reference?.message}>
                  <GlassInput id="reference" invalid={!!errors.reference} aria-describedby="reference-msg reference-err" {...form.register("reference")} />
                </Field>
                <Link href="/legal/privacy" target="_blank" className="inline-block text-sm font-bold text-info-text">
                  {T.privacyLink}
                </Link>
                <GlassButton type="submit" size="lg" className="w-full">
                  Continue
                </GlassButton>
              </form>
            )}

            {step === 4 && product && (
              <section aria-label="Review" className="space-y-4">
                <h2 className="text-xl font-extrabold">Review your request</h2>
                <dl className="divide-y divide-ink/10 rounded-[20px] bg-ink/[0.06] px-4 text-sm">
                  {[
                    ["Product", product.name],
                    ["Amount requested", formatINR(loanApp.amount)],
                    ["Repayment period", T.tenureLabel(loanApp.tenure)],
                    ["Monthly money", loanApp.info.range],
                    ["Source", loanApp.info.source],
                    ["Existing obligations", loanApp.info.obligations],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-2.5">
                      <dt className="text-ink-2">{k}</dt>
                      <dd className="text-right font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-ink-2">The final amount is subject to lender policy. You will see every charge in your offer before you accept.</p>
                <div>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentErr(null); }} aria-describedby="consent-err" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" disabled={busy} />
                    <span>I agree to my details being used by the lending partner to assess this loan request.</span>
                  </label>
                  {consentErr && <p id="consent-err" role="alert" className="mt-1 text-sm font-medium text-bad-text">{consentErr}</p>}
                </div>
                <GlassButton size="lg" className="w-full" onClick={send} disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-5 animate-spin" aria-hidden /> {T.submitting}
                    </>
                  ) : (
                    T.submit
                  )}
                </GlassButton>
              </section>
            )}
          </GlassCard>
        )}

        {(status === "submitted" || status === "assessment") && (
          <GlassCard radius="lg" className="p-5 text-center">
            <Hourglass className="mx-auto size-10 text-ink" aria-hidden />
            <p className="mt-2 font-bold">{loanApp.submittedAt ? `Submitted on ${formatDate(loanApp.submittedAt)}` : "Submitted"}</p>
            <p className="text-sm text-ink-2">You do not need to do anything. We will update this page.</p>
          </GlassCard>
        )}

        {status === "more_info" && (
          <GlassCard radius="lg" className="space-y-3 p-5">
            <h2 className="font-bold">{T.moreInfoTitle}</h2>
            <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm">
              <span className="font-bold">{EXTRA_INFO_REQUEST.item}.</span> {EXTRA_INFO_REQUEST.detail}
            </p>
            <Field id="reply" label={T.reply} error={replyErr}>
              <GlassTextarea id="reply" value={reply} onChange={(e) => { setReply(e.target.value); setReplyErr(null); }} invalid={!!replyErr} aria-describedby="reply-err" />
            </Field>
            <GlassButton onClick={sendReply}>{T.sendReply}</GlassButton>
          </GlassCard>
        )}

        {status === "offer_ready" && offer && <OfferView offer={offer} onAccept={() => accept()} onDecline={() => setStatus("declined")} />}

        {status === "accepted" && loanApp.acceptance && (
          <GlassCard radius="xl" strength="strong" className="space-y-3 p-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-ok-text" aria-hidden />
            <h2 className="text-2xl font-extrabold">{T.confirmedTitle}</h2>
            <p className="text-sm text-ink-2">{T.confirmedBody}</p>
            <dl className="divide-y divide-ink/10 rounded-[20px] bg-ink/[0.06] px-4 text-left text-sm">
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">{T.record.at}</dt><dd className="font-semibold">{formatDate(loanApp.acceptance.at)}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">{T.record.offer}</dt><dd className="font-mono font-semibold">{loanApp.acceptance.offerVersion}</dd></div>
              <div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-2">{T.record.terms}</dt><dd className="font-mono font-semibold">{loanApp.acceptance.termsVersion}</dd></div>
            </dl>
            <ReferenceNumber value={loanApp.acceptance.loanId} label="Loan" />
            <GlassButton size="lg" className="w-full" onClick={() => router.push(`/dashboard/loans/${loanApp.acceptance!.loanId}`)}>
              {T.viewLoan}
            </GlassButton>
          </GlassCard>
        )}

        {status === "declined" && (
          <GlassCard radius="lg" className="space-y-3 p-5">
            <h2 className="text-xl font-bold">{T.statuses.declined.t}</h2>
            {(() => {
              const r = DECLINE_REASONS.find((d) => d.code === loanApp.declineCode) ?? DECLINE_REASONS[0];
              return (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{T.declinedReasonTitle}</p>
                  <p className="text-sm">{r.label}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{T.declinedNext}</p>
                  <p className="text-sm">{r.next}</p>
                </>
              );
            })()}
            <div className="flex flex-wrap gap-2">
              <GlassButton onClick={() => { reset(); setStep(1); }}>Start a new application</GlassButton>
              <GlassButton asChild variant="secondary">
                <Link href="/dashboard/support">Contact support</Link>
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
