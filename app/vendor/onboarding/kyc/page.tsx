import type { Metadata } from "next";
import { KycStep } from "@/components/vendor/onboarding/kyc-step";

export const metadata: Metadata = { title: "ID check" };

export default function Page() {
  return <KycStep />;
}
