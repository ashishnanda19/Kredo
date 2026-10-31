"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Combobox } from "@/components/forms/combobox";
import { Field } from "@/components/forms/field";
import { FileDropZone } from "@/components/forms/file-drop";
import { GlassSelect } from "@/components/forms/select";
import { GlassButton, GlassFieldError, GlassInput } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { COLLEGES, COURSES, YEARS } from "@/lib/mock-data";
import { useHydrated, useStore } from "@/lib/store/store";
import { spring } from "@/lib/theme";
import { PortalShell } from "./page-shell";
import Link from "next/link";

const T = COPY.verify;
const steps = T.stepNames;

const detailsSchema = z.object({
  idNumber: z.string().trim().regex(/^[A-Za-z0-9/-]{5,20}$/, "Use 5 to 20 letters, numbers, / or -."),
  fullName: z.string().trim().min(3, "Enter your full name.").regex(/^[A-Za-z .'-]+$/, "Use letters only."),
  course: z.string().min(1, "Choose your course."),
  year: z.string().min(1, "Choose your year."),
  email: z.string().trim().email("That doesn't look like an email.").or(z.literal("")),
  dob: z
    .string()
    .min(1, "Enter your date of birth.")
    .refine((v) => new Date(v) <= new Date("2008-10-30"), "You must be 18 or older."),
});
type Details = z.infer<typeof detailsSchema>;

const ID_COPY = { drop: T.upload.drop, hint: T.upload.hint, camera: T.upload.camera, choose: T.upload.choose, retake: T.upload.retake, remove: T.upload.remove, blur: T.upload.blur, scanning: T.upload.scanning };

function WizardBody({ initialStep }: { initialStep: number }) {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const setDraft = useStore((s) => s.setDraft);
  const submit = useStore((s) => s.submitVerification);
  const grant = useStore((s) => s.grantConsent);

  const [step, setStep] = useState(initialStep);
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [uploadErr, setUploadErr] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState<string | null>(null);
  const [collegeErr, setCollegeErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const form = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { idNumber: draft.idNumber, fullName: draft.fullName, course: draft.course, year: draft.year, email: draft.email, dob: draft.dob },
  });
  const { errors } = form.formState;

  const notListed = draft.collegeNotListed;
  const collegeOk = notListed ? draft.requestedCollege.trim().length >= 3 : !!draft.college;

  function next1() {
    if (!collegeOk) {
      setCollegeErr(notListed ? "Enter your college name and city." : "Choose your college from the list, or use \"My college is not listed\".");
      return;
    }
    setCollegeErr(null);
    setStep(2);
  }
  function next2(v: Details) {
    setDraft({ idNumber: v.idNumber, fullName: v.fullName, course: v.course, year: v.year, email: v.email, dob: v.dob });
    setStep(3);
  }
  function next3() {
    if (!front || !back) {
      setUploadErr(true);
      return;
    }
    setUploadErr(false);
    setStep(4);
  }
  function finish() {
    if (!consent) {
      setConsentErr(T.review.needConsent);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      grant("identity");
      submit(
        {
          college: notListed ? `${draft.requestedCollege} (requested)` : draft.college,
          fullName: draft.fullName,
          course: draft.course,
          year: draft.year,
          idMasked: `••••${draft.idNumber.slice(-4)}`,
          hasFront: front,
          hasBack: back,
        },
        notListed,
      );
      router.push("/verify/status");
    }, 1000);
  }

  const back_ = step > 1 ? (
    <button type="button" onClick={() => setStep(step - 1)} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden /> Back
    </button>
  ) : null;

  return (
    <PortalShell width="max-w-xl" back={{ href: "/dashboard", label: "Exit" }}>
      <div className="flex items-center justify-between text-xs font-bold text-ink-2">
        <span>
          Step {step} of {steps.length}
        </span>
        <span>{steps[step - 1]}</span>
      </div>
      <div role="progressbar" aria-label="Verification progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step} className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10 p-[3px]">
        <motion.div className="bg-pill text-pill-fg h-full rounded-full" initial={false} animate={{ width: `${(step / steps.length) * 100}%` }} transition={spring.soft} />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ink/[0.07] px-4 py-3 text-xs leading-relaxed">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-info-text" aria-hidden /> {T.privacyNote}
      </p>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{T.titles[step - 1]}</h1>

      <div className="mt-5">
        {back_}

        {/* Step 1: college */}
        <section hidden={step !== 1} aria-label={T.titles[0]} className="space-y-4">
          {!notListed ? (
            <Field id="college" label={T.college.search} why={T.college.why} error={collegeErr}>
              <Combobox
                id="college"
                options={COLLEGES}
                value={draft.college}
                onSelect={(v) => {
                  setDraft({ college: v });
                  setCollegeErr(null);
                }}
                onNotListed={() => setDraft({ collegeNotListed: true, college: "" })}
                notListedLabel={T.college.none}
                noResults={T.college.noResults}
                placeholder="Start typing your college name"
                invalid={!!collegeErr}
                aria-describedby="college-msg college-err"
              />
            </Field>
          ) : (
            <div className="space-y-3 rounded-[20px] bg-ink/[0.06] p-4">
              <h2 className="font-bold">{T.college.noneTitle}</h2>
              <p className="text-sm text-ink-2">{T.college.noneBody}</p>
              <Field id="requested" label={T.college.requested} error={collegeErr}>
                <GlassInput id="requested" value={draft.requestedCollege} onChange={(e) => setDraft({ requestedCollege: e.target.value })} invalid={!!collegeErr} aria-describedby="requested-err" />
              </Field>
              <button type="button" onClick={() => setDraft({ collegeNotListed: false, requestedCollege: "" })} className="min-h-11 text-sm font-bold text-info-text">
                Back to the list
              </button>
            </div>
          )}
          <GlassButton size="lg" className="w-full" onClick={next1}>
            Continue
          </GlassButton>
        </section>

        {/* Step 2: details */}
        <form hidden={step !== 2} onSubmit={form.handleSubmit(next2)} noValidate aria-label={T.titles[1]} className="space-y-4">
          <Field id="idNumber" label={T.details.id.label} why={T.details.id.why} hint={T.details.id.hint} error={errors.idNumber?.message}>
            <GlassInput id="idNumber" autoComplete="off" autoCapitalize="characters" invalid={!!errors.idNumber} aria-describedby="idNumber-msg idNumber-err" {...form.register("idNumber")} />
          </Field>
          <Field id="fullName" label={T.details.name.label} why={T.details.name.why} error={errors.fullName?.message}>
            <GlassInput id="fullName" autoComplete="name" invalid={!!errors.fullName} aria-describedby="fullName-msg fullName-err" {...form.register("fullName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="course" label={T.details.course.label} why={T.details.course.why} error={errors.course?.message}>
              <GlassSelect id="course" invalid={!!errors.course} aria-describedby="course-msg course-err" {...form.register("course")}>
                <option value="">Choose</option>
                {COURSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </GlassSelect>
            </Field>
            <Field id="year" label={T.details.year.label} why={T.details.year.why} error={errors.year?.message}>
              <GlassSelect id="year" invalid={!!errors.year} aria-describedby="year-msg year-err" {...form.register("year")}>
                <option value="">Choose</option>
                {YEARS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </GlassSelect>
            </Field>
          </div>
          <Field id="email" label={T.details.email.label} why={T.details.email.why} error={errors.email?.message}>
            <GlassInput id="email" type="email" inputMode="email" autoComplete="email" invalid={!!errors.email} aria-describedby="email-msg email-err" {...form.register("email")} />
          </Field>
          <Field id="dob" label={T.details.dob.label} why={T.details.dob.why} error={errors.dob?.message}>
            <GlassInput id="dob" type="date" autoComplete="bday" invalid={!!errors.dob} aria-describedby="dob-msg dob-err" {...form.register("dob")} />
          </Field>
          <GlassButton type="submit" size="lg" className="w-full">
            Continue
          </GlassButton>
        </form>

        {/* Step 3: ID upload. Stays mounted so photos survive "Back" (they live only in this tab's memory). */}
        <section hidden={step !== 3} aria-label={T.titles[2]} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropZone id="id-front" label={T.upload.front} accept={["image/jpeg", "image/png", "image/heic"]} allowCamera checkBlur tips={T.upload.tips} copy={{ ...ID_COPY, preview: "Preview of the front of your ID" }} onChange={setFront} invalid={uploadErr && !front} />
            <FileDropZone id="id-back" label={T.upload.back} accept={["image/jpeg", "image/png", "image/heic"]} allowCamera checkBlur tips={T.upload.tips} copy={{ ...ID_COPY, preview: "Preview of the back of your ID" }} onChange={setBack} invalid={uploadErr && !back} />
          </div>
          <GlassFieldError id="upload-err">{uploadErr && (!front || !back) ? T.upload.required : null}</GlassFieldError>
          <GlassButton size="lg" className="w-full" onClick={next3}>
            Continue
          </GlassButton>
        </section>

        {/* Step 4: consent and review */}
        <section hidden={step !== 4} aria-label={T.titles[3]} className="space-y-4">
          <dl className="divide-y divide-ink/10 rounded-[20px] bg-ink/[0.06] px-4 text-sm">
            {[
              ["College", notListed ? `${draft.requestedCollege} (not listed, requested)` : draft.college],
              ["Full name", draft.fullName],
              ["Course", `${draft.course}, ${draft.year}`],
              ["College ID", draft.idNumber ? `••••${draft.idNumber.slice(-4)}` : ""],
              ["Date of birth", draft.dob],
              ["College email", draft.email || "Not given"],
              ["ID photos", front && back ? "Front and back selected (kept in this tab only)" : "Missing"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5">
                <dt className="text-ink-2">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-[20px] border border-ink/15 p-4 text-sm">
            <h2 className="flex items-center gap-2 font-bold">
              <ShieldCheck className="size-4 text-info-text" aria-hidden /> {T.review.noticeTitle}
            </h2>
            <p className="mt-1.5 text-ink-2">{T.review.notice}</p>
            <Link href="/legal/privacy" target="_blank" className="mt-2 inline-block text-sm font-bold text-info-text">
              {T.review.read}
            </Link>
          </div>
          <div>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentErr(null); }} aria-describedby="consent-err" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" disabled={busy} />
              <span>{T.review.consent}</span>
            </label>
            <GlassFieldError id="consent-err">{consentErr}</GlassFieldError>
          </div>
          <GlassButton size="lg" className="w-full" onClick={finish} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden /> {T.review.submitting}
              </>
            ) : (
              T.review.submit
            )}
          </GlassButton>
        </section>
      </div>
    </PortalShell>
  );
}

/** Waits for persisted state, guards access, then mounts the wizard at the right step (data kept, photos re-selected). */
export function VerifyWizard() {
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const status = useStore((s) => s.verification.status);
  const resumeStep = useStore((s) => s.verification.resumeStep);

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) router.replace("/login?next=/verify");
    else if (status === "accepted" || status === "pending") router.replace("/verify/status");
  }, [hydrated, loggedIn, status, router]);

  if (!hydrated || !loggedIn || status === "accepted" || status === "pending")
    return (
      <PortalShell width="max-w-xl">
        <div role="status" className="py-16 text-center text-ink-2">
          {COPY.gate.loading}
        </div>
      </PortalShell>
    );
  return <WizardBody initialStep={resumeStep ?? 1} />;
}
