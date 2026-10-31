import type { Metadata } from "next";
import { VerifyStatus } from "@/components/portal/verify-status";

export const metadata: Metadata = { title: "Verification status" };

export default function Page() {
  return <VerifyStatus />;
}
