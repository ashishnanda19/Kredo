"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassButton, GlassInput } from "@/components/glass";
import { DEMO_OTP } from "@/lib/demo/constants";
import { ONB } from "@/lib/copy-demo";
import { CATEGORIES, validateDetails, type StallDetails } from "@/lib/domain/vendors";
import { saveDetails } from "@/lib/store/vendor-actions";
import { useWorld } from "@/lib/store/world";
import { cn } from "@/lib/utils";
import { STEP_ROUTE, useOnboarding } from "./use-onboarding";
import { WizardFrame } from "./wizard-frame";

const t = ONB.details;

/** Step 1 for someone who isn't signed in at all: a phone number and a one-time code. */
function PhoneStep({ onDone }: { onDone: (maskedPhone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const digits = phone.replace(/\D/g, "");
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sent) {
          if (digits.length !== 10) return setErr(t.phoneBad);
          setErr(null);
          return setSent(true);
        }
        if (code !== DEMO_OTP) return setErr(t.otpWrong);
        onDone(`+91 ${digits.slice(0, 2)}••• ••${digits.slice(-3)}`);
      }}
    >
      <h3 className="text-base font-bold">{t.phoneTitle}</h3>
      <Field id="v-phone" label={t.phoneLabel} why={t.phoneWhy} error={!sent ? err : null}>
        <GlassInput id="v-phone" inputMode="numeric" autoComplete="tel-national" maxLength={12} value={phone} disabled={sent} aria-describedby="v-phone-msg" invalid={!sent && !!err} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      {sent && (
        <Field id="v-otp" label={t.otpLabel} hint={t.otpDemo(DEMO_OTP)} error={err}>
          <GlassInput id="v-otp" inputMode="numeric" maxLength={6} value={code} aria-describedby="v-otp-msg" invalid={!!err} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </Field>
      )}
      <GlassButton type="submit" size="lg" className="w-full">{sent ? t.save : t.sendCode}</GlassButton>
    </form>
  );
}

export function DetailsStep() {
  const router = useRouter();
  const { ready, vendor } = useOnboarding("details");
  const studentId = useWorld((s) => s.session.studentId);
  const [phoneOk, setPhoneOk] = useState(false);
  const [form, setForm] = useState<StallDetails | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof StallDetails, string>>>({});

  const value: StallDetails = form ?? (vendor ? { ownerName: vendor.ownerName, stallName: vendor.stallName, category: vendor.category, campusArea: vendor.campusArea, hours: vendor.hours } : { ownerName: "", stallName: "", category: "food", campusArea: "", hours: "" });
  const set = (k: keyof StallDetails, v: string) => setForm({ ...value, [k]: v } as StallDetails);
  const needsPhone = !vendor && !studentId && !phoneOk;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateDetails(value);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    saveDetails(value);
    router.push(STEP_ROUTE.kyc);
  }

  return (
    <WizardFrame step="details" title={needsPhone ? t.phoneTitle : "About your stall"} ready={ready}>
      {needsPhone ? (
        <PhoneStep onDone={() => setPhoneOk(true)} />
      ) : (
        <form noValidate onSubmit={submit} className="space-y-4">
          {!vendor && studentId && <p className="text-sm text-ink-2">{t.usingStudentPhone}</p>}
          <Field id="v-owner" label={t.owner} error={errors.ownerName}>
            <GlassInput id="v-owner" autoComplete="name" value={value.ownerName} invalid={!!errors.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          </Field>
          <Field id="v-stall" label={t.stall} error={errors.stallName}>
            <GlassInput id="v-stall" value={value.stallName} invalid={!!errors.stallName} onChange={(e) => set("stallName", e.target.value)} />
          </Field>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold">{t.category}</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" aria-pressed={value.category === c.value} onClick={() => set("category", c.value)} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors", value.category === c.value ? "border-transparent bg-accent text-accent-ink" : "border-hairline hover:bg-card")}>
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Field id="v-area" label={t.area} hint={t.areaHint} error={errors.campusArea}>
            <GlassInput id="v-area" value={value.campusArea} aria-describedby="v-area-msg" invalid={!!errors.campusArea} onChange={(e) => set("campusArea", e.target.value)} />
          </Field>
          <Field id="v-hours" label={t.hours} hint={t.hoursHint} error={errors.hours}>
            <GlassInput id="v-hours" value={value.hours} aria-describedby="v-hours-msg" invalid={!!errors.hours} onChange={(e) => set("hours", e.target.value)} />
          </Field>
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline p-3 text-sm text-ink-2">
            <ImageIcon className="size-5 shrink-0" aria-hidden />
            <span><span className="font-semibold text-ink">{t.photo}.</span> {t.photoNote}</span>
          </div>
          <GlassButton type="submit" size="lg" className="w-full">{t.save}</GlassButton>
        </form>
      )}
    </WizardFrame>
  );
}
