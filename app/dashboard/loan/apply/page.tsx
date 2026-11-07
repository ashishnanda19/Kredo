import type { Metadata } from "next";
import { LoanApply } from "@/components/loans/loan-apply";

export const metadata: Metadata = { title: "Apply for coins" };

export default function Page() {
  return <LoanApply />;
}
