"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLES } from "@/lib/copy-demo";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Smartphone } from "lucide-react";
import { Field } from "@/components/forms/field";
import { OtpInput } from "@/components/forms/otp-input";
import { GlassButton, GlassFieldError, GlassInput } from "@/components/glass";
import { COPY } from "@/lib/copy";
import { OTP_ATTEMPT_LIMIT, useHydrated, useStore } from "@/lib/store/store";
import { PortalShell } from "./page-shell";

type Mode = "login" | "signup" | "recover";
const RESEND = 30;

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9."),
  terms: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

const mask = (m: string) => `+91 ${m.slice(0, 2)}••• ••${m.slice(-3)}`;

export function AuthFlow({ mode }: { mode: Mode }) {
  const t = COPY.auth;
  const router = useRouter();
  const hydrated = useHydrated();
  const loggedIn = useStore((s) => s.session.loggedIn);
  const attempts = useStore((s) => s.session.otpAttempts);
  const edge = useStore((s) => s.session.edge);
  const login = useStore((s) => s.login);
  const otpFail = useStore((s) => s.otpFail);
  const otpReset = useStore((s) => s.otpReset);
  const setEdge = useStore((s) => s.setEdge);
  const verificationStatus = useStore((s) => s.verification.status);

  const [phase, setPhase] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(RESEND);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { mobile: "", terms: false } });
  const { errors } = form.formState;

  useEffect(() => {
    if (hydrated && loggedIn && edge === "none" && phase === "mobile") router.replace("/dashboard");
  }, [hydrated, loggedIn, edge, phase, router]);

  useEffect(() => {
    if (phase !== "otp" || secs <= 0) return;
    const id = setTimeout(() => setSecs((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secs]);

  const titles = { login: [t.loginTitle, t.loginSub], signup: [t.signupTitle, t.signupSub], recover: [t.recoverTitle, t.recoverSub] }[mode];
  const locked = edge === "locked";

  function sendCode(v: Values) {
    if (mode === "signup" && !v.terms) {
      form.setError("terms", { message: "Please tick the box to continue." });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMobile(v.mobile);
      setDigits(Array(6).fill(""));
      setOtpError(null);
      setSecs(RESEND);
      setPhase("otp");
    }, 800);
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setOtpError("Enter all 6 digits.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      // Demo rule: 000000 simulates a wrong code, so the attempt limit and lock can be tried. Any other 6 digits pass.
      if (code === "000000") {
        otpFail();
        const left = OTP_ATTEMPT_LIMIT - (useStore.getState().session.otpAttempts);
        setOtpError(left <= 0 ? "Too many wrong codes. Your account is locked for safety." : `That code isn't right. ${t.attemptsLeft(left)}`);
        setDigits(Array(6).fill(""));
        return;
      }
      otpReset();
      login(mask(mobile));
      const next = new URLSearchParams(window.location.search).get("next");
      const dest = mode === "signup" && verificationStatus === "not_started" ? "/verify" : next && next.startsWith("/") ? next : "/dashboard";
      router.replace(dest);
    }, 800);
  }

  if (locked) {
    return (
      <PortalShell>
        <h1 className="text-2xl font-extrabold">{COPY.session.lockedTitle}</h1>
        <p className="mt-2 text-ink-2">{COPY.session.lockedBody}</p>
        <p className="mt-3 text-sm">{COPY.session.lockedHow}</p>
        <div className="mt-5 space-y-2">
          <GlassButton size="lg" className="w-full" onClick={() => setEdge("none")}>
            I waited, try again (demo)
          </GlassButton>
          <GlassButton asChild variant="secondary" size="lg" className="w-full">
            <Link href="/dashboard/support">{COPY.session.supportCta}</Link>
          </GlassButton>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell back={{ href: "/", label: "Home" }}>
      <AnimatePresence mode="wait" initial={false}>
        {phase === "mobile" ? (
          <motion.div key="m" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            {edge === "session_expired" && (
              <p role="status" className="mb-4 rounded-2xl bg-warning-soft px-4 py-3 text-sm">
                {COPY.session.expiredBody}
              </p>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight">{titles[0]}</h1>
            <p className="mt-2 text-ink-2">{titles[1]}</p>
            <form onSubmit={form.handleSubmit(sendCode)} noValidate className="mt-6 space-y-5">
              <Field id="mobile" label={t.mobile} hint={t.mobileHint} error={errors.mobile?.message}>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
                  <span className="pointer-events-none absolute left-12 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-ink-2">+91</span>
                  <GlassInput id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} className="pl-[5.25rem]" invalid={!!errors.mobile} aria-describedby="mobile-msg mobile-err" disabled={busy} {...form.register("mobile")} />
                </div>
              </Field>
              {mode === "signup" && (
                <div>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" disabled={busy} {...form.register("terms")} />
                    <span>{t.terms}</span>
                  </label>
                  <GlassFieldError id="terms-err">{errors.terms?.message}</GlassFieldError>
                </div>
              )}
              <GlassButton type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden /> {t.sendingCode}
                  </>
                ) : (
                  t.sendCode
                )}
              </GlassButton>
            </form>
            <p className="mt-5 text-center text-sm text-ink-2">
              {mode === "login" ? (
                <>
                  {t.notAccount}{" "}
                  <Link href="/signup" className="font-bold text-info-text">
                    Sign up
                  </Link>
                  <br />
                  <Link href="/recover" className="font-bold text-info-text">
                    {t.recoverLink}
                  </Link>
                </>
              ) : (
                <>
                  {t.haveAccount}{" "}
                  <Link href="/login" className="font-bold text-info-text">
                    Log in
                  </Link>
                  {mode === "signup" && (
                    <>
                      <br />
                      {ROLES.signupStallPrompt}{" "}
                      <Link href="/start" className="font-bold text-info-text">
                        {ROLES.signupStallLink}
                      </Link>
                    </>
                  )}
                </>
              )}
            </p>
          </motion.div>
        ) : (
          <motion.div key="o" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <h1 className="text-3xl font-extrabold tracking-tight">{t.otpTitle}</h1>
            <p className="mt-2 text-ink-2">{t.otpSub(mask(mobile))}</p>
            <form onSubmit={verify} noValidate className="mt-6 space-y-4">
              <OtpInput digits={digits} onChange={(d) => { setDigits(d); setOtpError(null); }} invalid={!!otpError} />
              <GlassFieldError id="otp-err">{otpError}</GlassFieldError>
              {attempts > 0 && !otpError && <p className="text-xs text-ink-2">{t.attemptsLeft(OTP_ATTEMPT_LIMIT - attempts)}</p>}
              <p className="text-xs text-ink-2">Demo tip: 000000 counts as a wrong code.</p>
              <GlassButton type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden /> {t.verifying}
                  </>
                ) : (
                  t.verify
                )}
              </GlassButton>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setPhase("mobile")} className="min-h-11 font-bold text-info-text">
                  Change number
                </button>
                <button type="button" disabled={secs > 0} onClick={() => { setSecs(RESEND); setDigits(Array(6).fill("")); }} className="min-h-11 font-bold text-info-text disabled:text-ink-2">
                  {secs > 0 ? t.resendIn(secs) : t.resend}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalShell>
  );
}
