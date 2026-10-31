import type { Metadata } from "next";
import { KycFlow } from "@/components/portal/kyc-flow";

export const metadata: Metadata = { title: "KYC and consent" };

export default function Page() {
  return <KycFlow />;
}
