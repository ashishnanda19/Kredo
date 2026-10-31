import type { Metadata } from "next";
import { CreditProfile } from "@/components/dashboard/credit-profile";

export const metadata: Metadata = { title: "Credit profile" };

export default function Page() {
  return <CreditProfile />;
}
