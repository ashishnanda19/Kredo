import type { Metadata } from "next";
import { AgreementStep } from "@/components/vendor/onboarding/agreement-step";

export const metadata: Metadata = { title: "Vendor agreement" };

export default function Page() {
  return <AgreementStep />;
}
