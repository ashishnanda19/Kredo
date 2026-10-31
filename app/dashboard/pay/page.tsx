import type { Metadata } from "next";
import { PayFlow } from "@/components/dashboard/pay-flow";

export const metadata: Metadata = { title: "Scan and pay" };

export default function PayPage() {
  return <PayFlow />;
}
