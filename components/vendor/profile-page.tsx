"use client";

import { useRouter } from "next/navigation";
import { GlassButton, GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { VENDOR } from "@/lib/copy-demo";
import { CATEGORIES } from "@/lib/domain/vendors";
import { fmtDateTime } from "@/lib/domain/time";
import { useWorld } from "@/lib/store/world";

const t = VENDOR.profile;

function Row({ k, v, testId }: { k: string; v: React.ReactNode; testId?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-2">{k}</dt>
      <dd data-testid={testId} className="text-right text-sm font-semibold">{v}</dd>
    </div>
  );
}

export function ProfilePage() {
  const router = useRouter();
  const vendor = useWorld((s) => (s.session.vendorId ? s.world.vendors[s.session.vendorId] : undefined));
  const phone = useWorld((s) => (vendor ? s.world.accounts[vendor.accountId]?.phoneMasked : undefined));
  const signOut = useWorld((s) => s.signOut);
  if (!vendor) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1>
      <GlassCard radius="xl" className="p-5">
        <dl className="divide-y divide-hairline">
          <Row k={t.stall} v={vendor.stallName} />
          <Row k={t.owner} v={vendor.ownerName} />
          <Row k={t.category} v={CATEGORIES.find((c) => c.value === vendor.category)?.label} />
          <Row k={t.area} v={vendor.campusArea} />
          <Row k={t.hours} v={vendor.hours} />
          {phone && <Row k={t.phone} v={phone} />}
          <Row k={t.status} v={<Badge tone={vendor.status === "accepted" ? "success" : "warning"}>{vendor.status === "accepted" ? VENDOR.verified : vendor.status}</Badge>} />
          <Row k={t.level} v={vendor.verificationLevel === "full" ? t.levelFull : t.levelLight} />
          <Row k={t.cap} v={`${vendor.dailyCap} ${VENDOR.coins}`} testId="profile-cap" />
          <Row k={t.bank} v={`${vendor.bankMasked} · ${vendor.bankVerified ? t.bankVerified : t.bankNotVerified}`} />
          {vendor.onboarding?.agreedAt && <Row k={t.agreed} v={fmtDateTime(vendor.onboarding.agreedAt)} />}
        </dl>
      </GlassCard>
      <GlassButton variant="outline" className="w-full" onClick={() => { signOut(); router.push("/start"); }}>{t.signOut}</GlassButton>
    </div>
  );
}
