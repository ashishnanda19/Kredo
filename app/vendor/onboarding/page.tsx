import type { Metadata } from "next";
import { DetailsStep } from "@/components/vendor/onboarding/details-step";

export const metadata: Metadata = { title: "Stall onboarding" };

export default function Page() {
  return <DetailsStep />;
}
