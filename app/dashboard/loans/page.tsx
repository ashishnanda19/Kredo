import type { Metadata } from "next";
import { LoansOverview } from "@/components/loans/loans-overview";

export const metadata: Metadata = { title: "My loans" };

export default function Page() {
  return <LoansOverview />;
}
