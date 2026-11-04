import type { Metadata } from "next";
import { AuraDisclaimer, AuraNav } from "@/components/aura/parts";
import { PageHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/glass";
import { EmptyState } from "@/components/shared/states";
import { WorldOr } from "@/components/student/world-or";
import { AURA } from "@/lib/copy-aura";

export const metadata: Metadata = { title: "Aura" };

// Aura replaces the Phase 2 credit profile and keeps its flag
const PHASE2 = process.env.NEXT_PUBLIC_PHASE2_CREDIT_PROFILE === "true";

export default function AuraLayout({ children }: { children: React.ReactNode }) {
  // a student signed in to the demo world gets the world's own Aura screen, without the original page chrome
  return (
    <WorldOr world={<div className="mx-auto max-w-3xl">{children}</div>}>
      {!PHASE2 ? (
        <div className="mx-auto max-w-2xl">
          <PageHeader title={AURA.title} />
          <GlassCard radius="lg"><EmptyState title="Coming soon" body="Aura is part of a later release." /></GlassCard>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <PageHeader title={AURA.title} />
          <AuraNav />
          <AuraDisclaimer className="mb-5" />
          {children}
        </div>
      )}
    </WorldOr>
  );
}
