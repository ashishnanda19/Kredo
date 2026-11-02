"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Store } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { Logo } from "@/components/shared/logo";
import { ROLES } from "@/lib/copy-demo";
import { PERSONAS, type Persona } from "@/lib/demo/constants";
import { useStore } from "@/lib/store/store";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DemoMoneyLabel } from "./demo-money-label";

/** Signs a seeded person into the world, and lines the existing student portal up with them so /dashboard opens. */
export function useJumpIn() {
  const router = useRouter();
  const signInAs = useWorld((s) => s.signInAs);
  return (p: Persona) => {
    const w = useWorld.getState().world;
    if (p.kind === "student" && p.studentId) {
      useStore.getState().applyPreset(w.students[p.studentId]?.verification === "accepted" ? "verified" : "new_student");
      signInAs(p.studentId, p.vendorId ?? null, "student");
      router.push("/dashboard");
    } else if (p.vendorId) {
      signInAs(null, p.vendorId, "vendor");
      router.push("/vendor");
    }
  };
}

export function StartChooser() {
  const hydrated = useWorldHydrated();
  const jump = useJumpIn();
  const t = ROLES;
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Logo href="/" />
        <DemoMoneyLabel />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.startTitle}</h1>
        <p className="mt-2 text-ink-2">{t.startSub}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard radius="xl" className="flex flex-col gap-4 p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft"><GraduationCap className="size-6" aria-hidden /></span>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{t.student.title}</h2>
            <p className="mt-1 text-sm text-ink-2">{t.student.body}</p>
          </div>
          <GlassButton asChild size="lg"><Link href="/signup">{t.student.cta}</Link></GlassButton>
        </GlassCard>
        <GlassCard radius="xl" className="flex flex-col gap-4 p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft"><Store className="size-6" aria-hidden /></span>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{t.vendor.title}</h2>
            <p className="mt-1 text-sm text-ink-2">{t.vendor.body}</p>
          </div>
          <GlassButton asChild size="lg" variant="accent"><Link href="/vendor/onboarding">{t.vendor.cta}</Link></GlassButton>
        </GlassCard>
      </div>

      {DEMO_ENABLED && hydrated && (
        <section aria-labelledby="jump-h" className="space-y-3">
          <div>
            <h2 id="jump-h" className="text-sm font-bold uppercase tracking-wider text-ink-2">{t.demoJump}</h2>
            <p className="text-xs text-ink-2">{t.demoJumpHint}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <li key={p.id}>
                <button type="button" data-testid={`persona-${p.id}`} onClick={() => jump(p)} className="flex min-h-14 w-full flex-col items-start rounded-2xl border border-hairline bg-card px-4 py-2 text-left transition-colors hover:bg-ink/5">
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="text-xs text-ink-2">{p.story}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
