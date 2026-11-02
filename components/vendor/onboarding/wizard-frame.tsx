"use client";

import { GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";
import { ONB } from "@/lib/copy-demo";
import { Stepper } from "./stepper";
import type { Step } from "./use-onboarding";

export function WizardFrame({ step, title, ready, children }: { step: Step; title: string; ready: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{ONB.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{ONB.sub}</p>
      </div>
      <Stepper step={step} />
      <GlassCard radius="xl" strength="strong" className="space-y-5 p-5 sm:p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        {ready ? children : <div role="status" aria-label="Loading" className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>}
      </GlassCard>
    </div>
  );
}
