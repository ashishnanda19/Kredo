"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorld, useWorldHydrated } from "@/lib/store/world";

export type Step = "details" | "kyc" | "bank" | "agreement" | "status";
export const STEP_ROUTE: Record<Step, string> = {
  details: "/vendor/onboarding",
  kyc: "/vendor/onboarding/kyc",
  bank: "/vendor/onboarding/bank",
  agreement: "/vendor/onboarding/agreement",
  status: "/vendor/onboarding/status",
};
export const STEP_ORDER: Step[] = ["details", "kyc", "bank", "agreement", "status"];

/** Loads the signed-in stall and sends the owner to the right step if they open one out of order. */
export function useOnboarding(step: Step) {
  const hydrated = useWorldHydrated();
  const router = useRouter();
  const vendorId = useWorld((s) => s.session.vendorId);
  const vendor = useWorld((s) => (s.session.vendorId ? s.world.vendors[s.session.vendorId] : undefined));

  let redirect: string | null = null;
  if (hydrated) {
    if (step === "details") {
      if (vendor && vendor.status !== "not_started") redirect = STEP_ROUTE.status;
    } else if (!vendor) redirect = STEP_ROUTE.details;
    else if (step !== "status" && vendor.status !== "not_started") redirect = STEP_ROUTE.status;
    else if ((step === "bank" || step === "agreement") && vendor.onboarding?.kyc !== "verified") redirect = STEP_ROUTE.kyc;
    else if (step === "agreement" && !vendor.bankVerified) redirect = STEP_ROUTE.bank;
  }
  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  return { ready: hydrated && !redirect, vendorId, vendor };
}
