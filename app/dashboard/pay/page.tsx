import type { Metadata } from "next";
import { PayFlow } from "@/components/dashboard/pay-flow";
import { PayWorld } from "@/components/student/pay-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata: Metadata = { title: "Scan and pay" };

export default function PayPage() {
  return (
    <WorldOr world={<PayWorld />}>
      <PayFlow />
    </WorldOr>
  );
}
