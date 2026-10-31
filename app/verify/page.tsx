import type { Metadata } from "next";
import { VerifyWizard } from "@/components/portal/verify-wizard";

export const metadata: Metadata = { title: "Verify you're a student" };

export default function VerifyPage() {
  return <VerifyWizard />;
}
