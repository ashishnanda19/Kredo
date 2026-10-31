"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GlassButton, GlassCard, GlassFieldError, GlassInput } from "@/components/glass";
import { Disclosure } from "@/components/shared/demo-tag";
import { Reveal } from "@/components/shared/reveal";
import { SuccessCheck } from "@/components/shared/success-check";
import { CoinBurst } from "@/components/three/coin-burst";
import { Label } from "@/components/ui/label";
import { COPY } from "@/lib/copy";
import { validateCollegeEmail, validateName, validateRequired } from "@/lib/validation";
import { SectionHeading } from "./section-heading";

type Errors = { name?: string | null; college?: string | null; email?: string | null };

export function EarlyAccessForm() {
  const s = COPY.signup;
  const [values, setValues] = useState({ name: "", college: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: null }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {
      name: validateName(values.name),
      college: validateRequired(values.college, "college"),
      email: validateCollegeEmail(values.email),
    };
    setErrors(next);
    if (next.name || next.college || next.email) {
      const first = (["name", "college", "email"] as const).find((k) => next[k]);
      if (first) document.getElementById(`ea-${first}`)?.focus();
      return;
    }
    setBusy(true);
    // No network call: this is a front-end preview.
    setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, 700);
  }

  return (
    <section id="signup" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <GlassCard radius="xl" strength="strong" glow="magenta" className="relative overflow-hidden p-6 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-neon-magenta/30 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading eyebrow={s.eyebrow} lines={["Be first", "on campus."]} accent={1} />
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/90 [html:not(.dark)_&]:text-foreground/85">{s.body}</p>
            </div>

            <div aria-live="polite" className="relative">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative flex flex-col items-center overflow-hidden rounded-[24px] bg-foreground/[0.06] px-6 py-10 text-center"
                  >
                    <CoinBurst />
                    <SuccessCheck />
                    <h3 className="mt-5 text-2xl font-extrabold">{s.doneTitle}</h3>
                    <p className="mt-1 text-muted">
                      Thanks, {values.name.trim().split(" ")[0]}. {s.doneBody}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form key="form" exit={{ opacity: 0, y: -8 }} onSubmit={submit} noValidate className="space-y-4">
                    <Field id="ea-name" label={s.name} error={errors.name}>
                      <GlassInput id="ea-name" autoComplete="name" value={values.name} onChange={set("name")} invalid={!!errors.name} aria-describedby={errors.name ? "ea-name-err" : undefined} />
                    </Field>
                    <Field id="ea-college" label={s.college} error={errors.college}>
                      <GlassInput id="ea-college" autoComplete="organization" value={values.college} onChange={set("college")} invalid={!!errors.college} aria-describedby={errors.college ? "ea-college-err" : undefined} />
                    </Field>
                    <Field id="ea-email" label={s.email} error={errors.email}>
                      <GlassInput id="ea-email" type="email" inputMode="email" autoComplete="email" placeholder={s.emailPlaceholder} value={values.email} onChange={set("email")} invalid={!!errors.email} aria-describedby={errors.email ? "ea-email-err" : undefined} />
                    </Field>
                    <GlassButton type="submit" size="lg" className="w-full" disabled={busy}>
                      {busy ? (
                        s.busy
                      ) : (
                        <>
                          {s.submit} <ArrowRight className="size-5" aria-hidden />
                        </>
                      )}
                    </GlassButton>
                    <Disclosure className="justify-center" />
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassCard>
      </Reveal>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <GlassFieldError id={`${id}-err`}>{error}</GlassFieldError>
    </div>
  );
}
