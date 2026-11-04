"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassButton, GlassCard } from "@/components/glass";
import { PROFILE_W } from "@/lib/copy-demo";
import { useWorld } from "@/lib/store/world";
import { useWorldStudent } from "./use-student";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-ink-2">{k}</dt><dd className="text-right text-sm font-semibold">{v}</dd></div>;
}

/** The signed-in demo student's profile. Only masked values: never an ID number or a photo. */
export function ProfileWorld() {
  const router = useRouter();
  const { world, student, studentId } = useWorldStudent();
  const signOut = useWorld((s) => s.signOut);
  if (!student || !studentId) return null;
  const phone = world.accounts[student.accountId]?.phoneMasked;
  return (
    <div className="space-y-5" data-testid="profile-world">
      <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold tracking-[-0.04em]">{PROFILE_W.title}</h1>
      <GlassCard radius="xl" className="p-5">
        <dl className="divide-y divide-hairline">
          <Row k="Name" v={`${student.firstName} ${student.lastInitial}.`} />
          <Row k={PROFILE_W.college} v={student.college} />
          <Row k={PROFILE_W.id} v={student.idMasked} />
          {phone && <Row k={PROFILE_W.phone} v={phone} />}
          <Row k={PROFILE_W.status} v={student.verification === "accepted" ? PROFILE_W.accepted : student.verification} />
        </dl>
        <p className="mt-3 text-xs text-ink-2">{PROFILE_W.note}</p>
      </GlassCard>
      <nav aria-label="Your record" className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
        {([["/dashboard/aura", PROFILE_W.links.aura], ["/dashboard/limit", PROFILE_W.links.limit], ["/dashboard/loans", PROFILE_W.links.loans]] as const).map(([href, label]) => (
          <Link key={href} href={href} className="glass glass-soft flex min-h-14 items-center justify-center rounded-[18px] px-2 py-2 leading-tight transition-transform active:scale-[0.97]">{label}</Link>
        ))}
      </nav>
      <GlassButton variant="outline" className="w-full" onClick={() => { signOut(); router.push("/start"); }}>{PROFILE_W.signOut}</GlassButton>
    </div>
  );
}
