import type { Metadata } from "next";
import { StatusStep } from "@/components/vendor/onboarding/status-step";

export const metadata: Metadata = { title: "Verification status" };

export default function Page() {
  return <StatusStep />;
}
