import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditProfile } from "@/components/dashboard/credit-profile";

export const metadata: Metadata = { title: "Credit profile" };

// Aura replaces the Phase 2 credit profile (same flag); its correction request lives on /dashboard/aura/about
const PHASE2 = process.env.NEXT_PUBLIC_PHASE2_CREDIT_PROFILE === "true";

export default function Page() {
  if (PHASE2) redirect("/dashboard/aura");
  return <CreditProfile />;
}
