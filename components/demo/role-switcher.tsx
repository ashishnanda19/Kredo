"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassSegmented } from "@/components/glass";
import { ROLES } from "@/lib/copy-demo";
import { needsReauth, planSwitch, type Switchable } from "@/lib/domain/roles";
import { getPolicy } from "@/lib/policy";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DemoMoneyLabel } from "./demo-money-label";
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
        className={className}
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
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 pt-3 sm:px-6 print:hidden">
      <DemoMoneyLabel />
      <RoleSwitcher />
    </div>
  );
}
