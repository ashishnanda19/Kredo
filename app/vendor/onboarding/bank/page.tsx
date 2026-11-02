import type { Metadata } from "next";
import { BankStep } from "@/components/vendor/onboarding/bank-step";

export const metadata: Metadata = { title: "Bank account" };

export default function Page() {
  return <BankStep />;
}
