"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, ChevronRight, LifeBuoy, LockKeyhole, LogOut, Moon, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect } from "@/components/forms/select";
import { GlassButton, GlassCard, GlassInput } from "@/components/glass";
import { MaskedValue } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { Disclosure } from "@/components/shared/demo-tag";
import { InfoTip } from "@/components/shared/info-tip";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Switch } from "@/components/ui/switch";
import { BRAND, GRIEVANCE } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { formatDate, formatINR } from "@/lib/format";
import { available, CONSENT_PURPOSES, LANGUAGES, student } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { Avatar, PageHeader } from "./header";
import { LimitIncreaseSheet } from "./sheets";

const schema = z.object({
  displayName: z.string().trim().min(2, "Use at least 2 characters.").max(30, "Use 30 characters or fewer."),
  language: z.string(),
});
type Values = z.infer<typeof schema>;

function Panel({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <GlassCard radius="lg" role="region" aria-label={title} id={id} className="p-5">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </GlassCard>
  );
}

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <dt className="flex items-center gap-1.5 text-muted">
        <LockKeyhole className="size-3.5" aria-hidden /> {label}
      </dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[15px] font-bold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ProfileView() {
  const t = COPY.profile;
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const profile = useStore((s) => s.profile);
  const mobile = useStore((s) => s.session.mobile);
  const verification = useStore((s) => s.verification);
  const kyc = useStore((s) => s.kyc);
  const consents = useStore((s) => s.consents);
  const updateProfile = useStore((s) => s.updateProfile);
  const logout = useStore((s) => s.logout);
  const [notif, setNotif] = useState(profile.notif);
  const [saved, setSaved] = useState(false);
  const [increaseOpen, setIncreaseOpen] = useState(false);

  const verified = verification.status === "accepted";
  const sum = verification.summary;
  const pct = student.used / student.limit;

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { displayName: profile.displayName, language: profile.language } });
  const { errors, isSubmitting } = form.formState;

  async function save(v: Values) {
    await new Promise((r) => setTimeout(r, 500));
    updateProfile({ displayName: v.displayName.trim(), language: v.language, notif });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.title} />

      <div className="space-y-4">
        <GlassCard radius="xl" strength="strong" glow="violet" className="flex items-center gap-4 p-5">
          <Avatar size={64} />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-tight">{profile.displayName}</h2>
            <p className="truncate text-sm text-muted">{sum?.college ?? "College not added yet"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill kind="verification" value={verification.status} />
              <StatusPill kind="kyc" value={kyc.status} />
            </div>
          </div>
        </GlassCard>

        <Panel title={t.personal}>
          <dl className="divide-y divide-foreground/10">
            <ReadOnly label="Mobile">{mobile ? <MaskedValue value={mobile} label="Mobile number" /> : "Not set"}</ReadOnly>
            <ReadOnly label="Full name">{sum?.fullName ?? <span className="text-muted">Added at verification</span>}</ReadOnly>
            <ReadOnly label="College">{sum?.college ?? <span className="text-muted">Added at verification</span>}</ReadOnly>
            <ReadOnly label="Course">{sum ? `${sum.course}, ${sum.year}` : <span className="text-muted">Added at verification</span>}</ReadOnly>
            <ReadOnly label="College ID">{sum ? <MaskedValue value={sum.idMasked} label="College ID" /> : <span className="text-muted">Added at verification</span>}</ReadOnly>
          </dl>
          <p className="mt-2 text-xs text-muted">{verified ? t.lockedWhy : "These fields are filled from your verification and become read-only once it is accepted."}</p>
          {verified && (
            <GlassButton asChild variant="soft" size="sm" className="mt-3">
              <Link href="/dashboard/profile/privacy#correction">Request a correction</Link>
            </GlassButton>
          )}
        </Panel>

        <Panel title={t.editable}>
          <form onSubmit={form.handleSubmit(save)} noValidate className="space-y-4">
            <Field id="displayName" label={t.displayName} error={errors.displayName?.message}>
              <GlassInput id="displayName" autoComplete="nickname" invalid={!!errors.displayName} aria-describedby="displayName-err" disabled={isSubmitting} {...form.register("displayName")} />
            </Field>
            <Field id="language" label={t.language}>
              <GlassSelect id="language" disabled={isSubmitting} {...form.register("language")}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </GlassSelect>
            </Field>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">{t.notifications}</legend>
              <div className="divide-y divide-foreground/10">
                <Toggle id="n-sms" label="SMS" hint="Reminders and codes" checked={notif.sms} onChange={(v) => setNotif({ ...notif, sms: v })} />
                <Toggle id="n-email" label="Email" hint="Receipts and statements" checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
                <Toggle id="n-push" label="In-app" hint="Due date reminders" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
              </div>
            </fieldset>
            <div className="flex items-center gap-3">
              <GlassButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : t.save}
              </GlassButton>
              {saved && (
                <span role="status" className="text-sm font-semibold text-success">
                  {t.saved}
                </span>
              )}
            </div>
          </form>
        </Panel>

        <Panel title={t.consents}>
          <p className="mb-2 text-sm text-muted">{t.consentsBody}</p>
          <ul className="divide-y divide-foreground/10">
            {CONSENT_PURPOSES.map((c) => {
              const r = consents[c.id];
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold">{c.title}</span>
                  <span className="text-right text-xs text-muted">{r ? `${r.granted ? "Given" : "Withdrawn"} ${formatDate(r.at)}, notice ${r.version}` : "Not given yet"}</span>
                </li>
              );
            })}
          </ul>
          <GlassButton asChild variant="soft" size="sm" className="mt-3">
            <Link href="/dashboard/profile/privacy">
              <ShieldCheck className="size-4" aria-hidden /> {t.privacy}
            </Link>
          </GlassButton>
        </Panel>

        <Panel title="Your credit limit">
          <div className="flex items-center gap-5">
            <ProgressRing value={pct} size={96} stroke={10} label={`${Math.round(pct * 100)} percent of limit used`}>
              <span className="text-lg font-extrabold tabular-nums">{Math.round(pct * 100)}%</span>
            </ProgressRing>
            <dl className="flex-1 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="flex items-center gap-1 text-muted">
                  Total limit <InfoTip text="The most you can have outstanding at once." />
                </dt>
                <dd className="font-bold tabular-nums">{formatINR(student.limit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Used</dt>
                <dd className="font-bold tabular-nums">{formatINR(student.used)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Available</dt>
                <dd className="font-bold tabular-nums">{formatINR(available)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Next review</dt>
                <dd className="font-bold">{formatDate(student.nextReview)}</dd>
              </div>
            </dl>
          </div>
          <GlassButton variant="soft" className="mt-4 w-full" onClick={() => setIncreaseOpen(true)}>
            <TrendingUp className="size-4" aria-hidden /> {COPY.dashboard.quick.increase}
          </GlassButton>
          <p className="mt-2 text-xs text-muted">Limits are decided by our lending partner and aren&rsquo;t guaranteed.</p>
        </Panel>

        <Panel title="Display and help">
          <div className="divide-y divide-foreground/10">
            <div className="flex min-h-14 items-center gap-3 py-2">
              <Moon className="size-5 text-neon-violet" aria-hidden />
              <label htmlFor="s-dark" className="flex-1 text-[15px] font-bold">
                {t.dark.label}
              </label>
              <Switch id="s-dark" checked={resolvedTheme !== "light"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
            </div>
            {[
              { icon: LifeBuoy, label: "Support and complaints", href: "/dashboard/support" },
              { icon: ShieldAlert, label: t.grievance, href: `mailto:${GRIEVANCE.email}` },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="flex min-h-14 items-center gap-3">
                <l.icon className="size-5 text-neon-violet" aria-hidden />
                <span className="flex-1 text-[15px] font-bold">{l.label}</span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            ))}
          </div>
        </Panel>

        <GlassButton
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            logout();
            router.replace("/");
          }}
        >
          <LogOut className="size-5" aria-hidden /> {COPY.auth.logout}
        </GlassButton>
        <div className="space-y-1 pb-2 text-center">
          <Disclosure className="justify-center" />
          <p className="text-xs text-muted">
            {BRAND.name} is not a bank or lender. Member since {student.memberSince}. {COPY.legal.demoTag}.
          </p>
          {verified && (
            <p className="flex items-center justify-center gap-1 text-xs text-success">
              <BadgeCheck className="size-3.5" aria-hidden /> Student status verified
            </p>
          )}
        </div>
      </div>

      <LimitIncreaseSheet open={increaseOpen} onOpenChange={setIncreaseOpen} />
    </div>
  );
}
