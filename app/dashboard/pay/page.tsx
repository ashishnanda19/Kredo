import type { Metadata } from "next";
import { PayFlow } from "@/components/dashboard/pay-flow";
import { PayWorld } from "@/components/student/pay-world";
import { WorldOr } from "@/components/student/world-or";

export const metadata: Metadata = { title: "Scan and pay" };

export default async function PayPage({ searchParams }: { searchParams: Promise<{ micro?: string }> }) {
  const { micro } = await searchParams;
  return (
    <WorldOr world={<PayWorld key={micro ? "micro" : "pay"} micro={micro === "1"} />}>
      <PayFlow />
    </WorldOr>
  );
}
