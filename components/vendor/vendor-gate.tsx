"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hourglass, Store } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";
import { GATE } from "@/lib/copy-demo";
import { useWorld, useWorldHydrated } from "@/lib/store/world";

function Block({ title, body, cta, href, icon }: { title: string; body: string; cta: string; href: string; icon: React.ReactNode }) {
  return (
    <GlassCard radius="xl" strength="strong" role="region" aria-label={title} className="mx-auto mt-10 max-w-md p-7 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft">{icon}</span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-2">{body}</p>
      <GlassButton asChild size="lg" className="mt-6 w-full"><Link href={href}>{cta}</Link></GlassButton>
    </GlassCard>
  );
}

/**
 * Guards /vendor/*. Onboarding pages are open to anyone signed in (that is how a stall account is created); everything
 * else needs an accepted stall. Each other state gets a calm, specific screen and the way forward.
 */
export function VendorGate({ children }: { children: React.ReactNode }) {
  const hydrated = useWorldHydrated();
  const path = usePathname();
  const session = useWorld((s) => s.session);
  const vendor = useWorld((s) => (s.session.vendorId ? s.world.vendors[s.session.vendorId] : undefined));

  if (!hydrated) return <div role="status" aria-label="Loading" className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 w-full rounded-[28px]" /></div>;
  if (path.startsWith("/vendor/onboarding")) return <>{children}</>;

  if (!session.activeRole) return <Block title={GATE.vendorSignIn} body="" cta="Choose how to sign in" href="/start" icon={<Store className="size-7" aria-hidden />} />;
  if (!vendor || vendor.status === "not_started") return <Block title={GATE.noVendorTitle} body={GATE.noVendorBody} cta={GATE.noVendorCta} href="/vendor/onboarding" icon={<Store className="size-7" aria-hidden />} />;
  if (vendor.status === "pending") return <Block title={GATE.pendingTitle} body={GATE.pendingBody} cta={GATE.statusCta} href="/vendor/onboarding/status" icon={<Hourglass className="size-7" aria-hidden />} />;
  if (vendor.status === "rejected" || vendor.status === "resubmission" || vendor.status === "expired") return <Block title={GATE.rejectedTitle} body={GATE.rejectedBody} cta={GATE.statusCta} href="/vendor/onboarding/status" icon={<Store className="size-7" aria-hidden />} />;
  if (vendor.status === "suspended") return <Block title={GATE.suspendedTitle} body={GATE.suspendedBody} cta="Back to start" href="/start" icon={<Store className="size-7" aria-hidden />} />;
  if (session.activeRole !== "vendor") return <Block title={GATE.wrongRoleTitle} body={GATE.wrongRoleBody} cta="Open the vendor view" href="/vendor" icon={<Store className="size-7" aria-hidden />} />;
  return <>{children}</>;
}
