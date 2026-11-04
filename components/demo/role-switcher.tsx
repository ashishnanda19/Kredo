"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassSegmented } from "@/components/glass";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/copy-demo";
import { needsReauth, planSwitch, type Switchable } from "@/lib/domain/roles";
import { getPolicy } from "@/lib/policy";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { ReauthSheet } from "./reauth-sheet";

/**
 * Student | Vendor. Two separate accounts for one person; this never merges them. A missing or unverified side leads to
 * that side's onboarding. Switching asks for the PIN again if the last confirmation is older than the policy allows.
 */
export function RoleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const session = useWorld((s) => s.session);
  const world = useWorld((s) => s.world);
  const setActiveRole = useWorld((s) => s.setActiveRole);
  const [pending, setPending] = useState<Switchable | null>(null);

  if (!session.activeRole) return null;
  const active = session.activeRole;

  function go(target: Switchable) {
    const plan = planSwitch(target, session, world);
    if (plan.kind === "stay") return;
    if (plan.kind === "switch" && needsReauth(session.confirmedAt, Date.now(), getPolicy().session.roleSwitchReauthMinutes)) return setPending(target);
    if (plan.kind === "switch") setActiveRole(target);
    router.push(plan.href);
  }

  return (
    <>
      <GlassSegmented
        className={cn("[&_button]:min-h-9 [&_button]:min-w-[4.5rem] [&_button]:px-3.5 [&_button]:text-[13px]", className)}
        label={ROLES.switcherLabel}
        value={active}
        options={[{ value: "student", label: ROLES.student_tab }, { value: "vendor", label: ROLES.vendor_tab }]}
        onChange={go}
      />
      <ReauthSheet
        open={pending !== null}
        onCancel={() => setPending(null)}
        onConfirmed={() => {
          const t = pending;
          setPending(null);
          if (t) {
            setActiveRole(t);
            router.push(planSwitch(t, session, world).href);
          }
        }}
      />
    </>
  );
}

/** A thin bar above the student dashboard that appears only while a demo-world person is signed in. */
export function WorldRoleBar() {
  const hydrated = useWorldHydrated();
  const active = useWorld((s) => s.session.activeRole);
  if (!hydrated || !active) return null;
  return (
    <div className="flex w-full items-center justify-end pb-3 print:hidden">
      <RoleSwitcher />
    </div>
  );
}
